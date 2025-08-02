import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import {
  user,
  chat,
  message,
  vote,
  memory,
  document,
  messageUsage,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete all user data in a transaction
    await db.transaction(async (tx) => {
      const userId = session.user.id;

      // First, get all chat IDs for this user
      const userChats = await tx
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.userId, userId));
      const chatIds = userChats.map((c) => c.id);

      if (chatIds.length > 0) {
        // Delete votes for all user's chats
        await tx.delete(vote).where(inArray(vote.chatId, chatIds));

        // Delete messages for all user's chats
        await tx.delete(message).where(inArray(message.chatId, chatIds));
      }

      // Delete all user's chats
      await tx.delete(chat).where(eq(chat.userId, userId));

      // Delete user's memories
      await tx.delete(memory).where(eq(memory.userId, userId));

      // Delete user's documents/attachments
      await tx.delete(document).where(eq(document.userId, userId));

      // Delete user's message usage data
      await tx.delete(messageUsage).where(eq(messageUsage.userId, userId));

      // Finally delete the user
      await tx.delete(user).where(eq(user.id, userId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 },
    );
  }
}
