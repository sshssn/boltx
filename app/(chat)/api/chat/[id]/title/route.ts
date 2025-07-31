import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateChatTitleById, getChatById } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title } = await request.json();
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Check if chat exists and belongs to user
    const chat = await getChatById(params.id);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the chat title
    await updateChatTitleById({
      chatId: params.id,
      title: title.trim(),
    });

    return NextResponse.json({ success: true, title: title.trim() });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
