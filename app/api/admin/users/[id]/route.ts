import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, messageUsage, memory, vote, message, chat, document } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role } = await request.json();

    if (!role || !['regular', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role using Drizzle ORM
    await db
      .update(user)
      .set({ role })
      .where(eq(user.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    // Delete user's data first (cascade delete)
    await db.delete(messageUsage).where(eq(messageUsage.userId, userId));
    await db.delete(memory).where(eq(memory.userId, userId));
    await db.delete(vote).where(eq(vote.userId, userId));
    await db.delete(message).where(eq(message.chatId, 
      db.select({ id: chat.id }).from(chat).where(eq(chat.userId, userId))
    ));
    await db.delete(chat).where(eq(chat.userId, userId));
    await db.delete(document).where(eq(document.userId, userId));

    // Finally delete the user
    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
