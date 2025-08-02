import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chat } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;

    // Check if chat exists and belongs to user
    const [existingChat] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId));

    if (!existingChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (existingChat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update chat to be pinned
    await db.update(chat).set({ pinned: true }).where(eq(chat.id, chatId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error pinning chat:', error);
    return NextResponse.json({ error: 'Failed to pin chat' }, { status: 500 });
  }
}
