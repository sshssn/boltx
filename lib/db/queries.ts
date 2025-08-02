import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { measureDatabaseQuery } from '../performance';
import { db } from '../db';

// Export db for other modules to use
export { db };

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  memory,
  messageUsage,
  type MessageUsage,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

export async function getUser(email: string): Promise<Array<User>> {
  return measureDatabaseQuery('getUser', async () => {
    try {
      // Use Drizzle ORM query builder instead of raw SQL
      const result = await db.select().from(user).where(eq(user.email, email));
      return result as Array<User>;
    } catch (error) {
      console.error('[GET USER ERROR]', error); // Log the actual error
      throw new ChatSDKError(
        'bad_request:database',
        'Failed to get user by email',
      );
    }
  });
}

export async function createUser(
  email: string,
  password: string,
  username?: string,
) {
  const hashedPassword = generateHashedPassword(password);

  try {
    // Use Drizzle ORM query builder instead of raw SQL
    const result = await db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
        username: username || null,
        role: 'client',
      })
      .returning({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    return result;
  } catch (error) {
    console.error('[CREATE USER ERROR]', error); // Log the actual error
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const password = generateHashedPassword(generateUUID());

  try {
    // Use Drizzle ORM query builder instead of raw SQL
    const result = await db
      .insert(user)
      .values({
        email,
        password,
        username: email,
        role: 'guest',
      })
      .returning({
        id: user.id,
        email: user.email,
      });
    return result;
  } catch (error) {
    console.error('[GUEST USER CREATION ERROR]', error); // Log the actual error
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Database error in saveMessages:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat title',
    );
  }
}

export async function updateMessageById({
  messageId,
  content,
}: {
  messageId: string;
  content: string;
}) {
  try {
    return await db
      .update(message)
      .set({
        parts: [{ type: 'text', text: content }],
      })
      .where(eq(message.id, messageId));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update message');
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      );

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt));

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

export async function getMemoryByUserId({
  userId,
  limit = 20,
}: { userId: string; limit?: number }) {
  try {
    return await db
      .select()
      .from(memory)
      .where(eq(memory.userId, userId))
      .orderBy(desc(memory.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get memory by user id',
    );
  }
}

export async function getMemoryCountByUserId({ userId }: { userId: string }) {
  try {
    const result = await db
      .select({ count: count() })
      .from(memory)
      .where(eq(memory.userId, userId));
    return result[0]?.count || 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get memory count by user id',
    );
  }
}

export async function addMemory({
  userId,
  content,
}: { userId: string; content: string }) {
  try {
    return await db.insert(memory).values({
      userId,
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to add memory');
  }
}

export async function deleteMemoryById({
  id,
  userId,
}: { id: string; userId: string }) {
  try {
    return await db
      .delete(memory)
      .where(and(eq(memory.id, id), eq(memory.userId, userId)));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete memory');
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [userRecord] = await db.select().from(user).where(eq(user.id, id));
    return userRecord || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by id');
  }
}

export async function getDocumentsByUserId({
  userId,
  limit = 50,
}: { userId: string; limit?: number }) {
  try {
    return await db
      .select()
      .from(document)
      .where(eq(document.userId, userId))
      .orderBy(desc(document.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by user id',
    );
  }
}

// Message usage tracking functions
export async function getMessageUsage({
  userId,
  ipAddress,
  date,
}: {
  userId?: string;
  ipAddress?: string;
  date: string; // YYYY-MM-DD format
}): Promise<MessageUsage | null> {
  try {
    const whereConditions = [eq(messageUsage.date, date)];

    if (userId) {
      whereConditions.push(eq(messageUsage.userId, userId));
    } else if (ipAddress) {
      whereConditions.push(eq(messageUsage.ipAddress, ipAddress));
    } else {
      throw new Error('Either userId or ipAddress must be provided');
    }

    const [usage] = await db
      .select()
      .from(messageUsage)
      .where(and(...whereConditions))
      .limit(1);

    return usage || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message usage',
    );
  }
}

export async function createOrUpdateMessageUsage({
  userId,
  ipAddress,
  userAgent,
  date,
  increment = 1,
}: {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  date: string; // YYYY-MM-DD format
  increment?: number;
}): Promise<MessageUsage> {
  try {
    const existingUsage = await getMessageUsage({ userId, ipAddress, date });

    if (existingUsage) {
      // Update existing record
      const [updated] = await db
        .update(messageUsage)
        .set({
          messageCount: existingUsage.messageCount + increment,
          updatedAt: new Date(),
        })
        .where(eq(messageUsage.id, existingUsage.id))
        .returning();

      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(messageUsage)
        .values({
          userId: userId || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          date,
          messageCount: increment,
        })
        .returning();

      return created;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create or update message usage',
    );
  }
}

export async function getMessageUsageCount({
  userId,
  ipAddress,
  date,
}: {
  userId?: string;
  ipAddress?: string;
  date: string; // YYYY-MM-DD format
}): Promise<number> {
  try {
    const usage = await getMessageUsage({ userId, ipAddress, date });
    return usage?.messageCount || 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message usage count',
    );
  }
}
