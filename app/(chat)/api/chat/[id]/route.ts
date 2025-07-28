import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getChatById,
  getMessagesByChatId,
  deleteChatById,
} from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat data
    const chat = await getChatById({ id });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user has access to this chat
    if (chat.visibility === 'private' && chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages for this chat
    const messagesFromDb = await getMessagesByChatId({ id });
    const messages = convertToUIMessages(messagesFromDb);

    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      visibility: chat.visibility,
      userId: chat.userId,
      createdAt: chat.createdAt,
      messages,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat data to verify ownership
    const chat = await getChatById({ id });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Only the chat owner can delete it
    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the chat
    await deleteChatById({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
