import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateChatTitleById, getChatById } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { title } = await request.json();
    const { id: chatId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify chat exists and user has access
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update chat title in database
    await updateChatTitleById({ chatId, title });

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error('Failed to update chat title:', error);
    return NextResponse.json(
      { error: 'Failed to update title' },
      { status: 500 },
    );
  }
}
