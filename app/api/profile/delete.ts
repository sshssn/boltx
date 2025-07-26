import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, chat, message, vote, memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { confirm } = await req.json();

    if (confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid confirmation' },
        { status: 400 },
      );
    }

    // Delete all user data in a transaction
    await db.transaction(async (tx) => {
      // Delete votes
      await tx.delete(vote).where(eq(vote.chatId, session.user.id));

      // Delete messages
      await tx.delete(message).where(eq(message.chatId, session.user.id));

      // Delete chats
      await tx.delete(chat).where(eq(chat.userId, session.user.id));

      // Delete memories
      await tx.delete(memory).where(eq(memory.userId, session.user.id));

      // Finally delete the user
      await tx.delete(user).where(eq(user.id, session.user.id));
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
