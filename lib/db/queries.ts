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

export { db };

export async function getUser(email: string): Promise<Array<User>> {
  return measureDatabaseQuery('getUser', async () => {
    return await db.select().from(user).where(eq(user.email, email));
  });
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [record] = await db.select().from(user).where(eq(user.id, id));
  return record;
}

export async function createUser(email: string, password: string, username?: string) {
  const hashedPassword = generateHashedPassword(password);
  return await db.insert(user).values({
    email,
    password: hashedPassword,
    username: username || null,
    role: 'regular',
  }).returning();
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());
  return await db.insert(user).values({
    email,
    password,
    username: email,
    role: 'guest',
  }).returning();
}

export async function saveChat({ id, userId, title, visibility }: { id: string; userId: string; title: string; visibility: VisibilityType }) {
  return await db.insert(chat).values({ id, createdAt: new Date(), userId, title, visibility });
}

export async function deleteChatById({ id }: { id: string }) {
  await db.delete(vote).where(eq(vote.chatId, id));
  await db.delete(message).where(eq(message.chatId, id));
  await db.delete(stream).where(eq(stream.chatId, id));
  return await db.delete(chat).where(eq(chat.id, id)).returning();
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  const whereConditions = [eq(chat.userId, id)];

  const cursorId = endingBefore || startingAfter;
  if (cursorId) {
    const [cursorChat] = await db
      .select({ id: chat.id, createdAt: chat.createdAt, userId: chat.userId })
      .from(chat)
      .where(and(eq(chat.id, cursorId), eq(chat.userId, id)))
      .limit(1);

    if (cursorChat?.createdAt) {
      if (endingBefore) {
        whereConditions.push(lt(chat.createdAt, cursorChat.createdAt));
      } else if (startingAfter) {
        whereConditions.push(gt(chat.createdAt, cursorChat.createdAt));
      }
    }
  }

  const rows = await db
    .select()
    .from(chat)
    .where(and(...whereConditions))
    .orderBy(desc(chat.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const chats = hasMore ? rows.slice(0, limit) : rows;

  return { chats, hasMore };
}

export async function getChatById({ id }: { id: string }) {
  const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
  return selectedChat;
}

export async function saveMessages({ messages }: { messages: Array<DBMessage> }) {
  return await db.insert(message).values(messages);
}

export async function getMessagesByChatId({ id }: { id: string }) {
  return await db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt));
}

export async function getMessageById({ id }: { id: string }) {
  return await db.select().from(message).where(eq(message.id, id)).orderBy(asc(message.createdAt));
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  return await db
    .delete(message)
    .where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)))
    .returning();
}

export async function voteMessage({ chatId, messageId, type }: { chatId: string; messageId: string; type: 'up' | 'down' }) {
  const isUpvoted = type === 'up';
  return await db.insert(vote).values({ chatId, messageId, isUpvoted }).onConflictDoUpdate({ target: [vote.chatId, vote.messageId], set: { isUpvoted } });
}

export async function getVotesByChatId({ id }: { id: string }) {
  return await db.select().from(vote).where(eq(vote.chatId, id));
}

export async function saveDocument({ id, title, kind, content, userId }: { id: string; title: string; kind: ArtifactKind; content: string; userId: string }) {
  return await db.insert(document).values({ id, title, kind, content, userId, createdAt: new Date() }).returning();
}

export async function getDocumentById({ id }: { id: string }) {
  const [doc] = await db.select().from(document).where(eq(document.id, id)).orderBy(desc(document.createdAt)).limit(1);
  return doc;
}

export async function getDocumentsById({ id }: { id: string }) {
  return await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .orderBy(desc(document.createdAt));
}

export async function getDocumentsByUserId({
  userId,
  limit = 50,
}: {
  userId: string;
  limit?: number;
}) {
  return await db
    .select()
    .from(document)
    .where(eq(document.userId, userId))
    .orderBy(desc(document.createdAt))
    .limit(limit);
}

export async function deleteDocumentsByIdAfterTimestamp({ id, timestamp }: { id: string; timestamp: Date }) {
  return await db.delete(document).where(and(eq(document.id, id), gt(document.createdAt, timestamp))).returning();
}

export async function saveSuggestions({ suggestions }: { suggestions: Array<Suggestion> }) {
  return await db.insert(suggestion).values(suggestions);
}

export async function getSuggestionsByDocumentId({ documentId }: { documentId: string }) {
  return await db.select().from(suggestion).where(eq(suggestion.documentId, documentId));
}

export async function updateChatVisiblityById({ chatId, visibility }: { chatId: string; visibility: 'private' | 'public' }) {
  return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
}

export async function updateChatTitleById({ chatId, title }: { chatId: string; title: string }) {
  return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
}

export async function getMemoryByUserId({ userId, limit = 20 }: { userId: string; limit?: number }) {
  return await db.select().from(memory).where(eq(memory.userId, userId)).orderBy(desc(memory.createdAt)).limit(limit);
}

export async function addMemory({ userId, content }: { userId: string; content: string }) {
  return await db.insert(memory).values({ userId, content, createdAt: new Date() });
}

export async function deleteMemoryById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  return await db
    .delete(memory)
    .where(and(eq(memory.id, id), eq(memory.userId, userId)))
    .returning();
}

export async function getMessageUsageCount({ userId, ipAddress, date }: { userId?: string; ipAddress?: string; date: string }): Promise<number> {
  const whereConditions = [eq(messageUsage.date, date)];
  if (userId) whereConditions.push(eq(messageUsage.userId, userId));
  else if (ipAddress) whereConditions.push(eq(messageUsage.ipAddress, ipAddress));
  else return 0;

  const [usage] = await db.select().from(messageUsage).where(and(...whereConditions)).limit(1);
  return usage?.messageCount ?? 0;
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  const streamIds = await db.select({ id: stream.id }).from(stream).where(eq(stream.chatId, chatId)).orderBy(asc(stream.createdAt));
  return streamIds.map(({ id }) => id);
}
// Support for other admin/tracking functions as needed...
