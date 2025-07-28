import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { updateChatTitleById, getChatById } from '@/lib/db/queries';
import {
  generateTitleFromUserMessage,
  generateTitleFromAIResponse,
} from '@/lib/ai/title-generation';

export async function POST(request: NextRequest) {
  try {
    const { chatId, userMessage, aiResponse } = await request.json();

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

    // Generate title using AI
    let title: string;
    try {
      if (aiResponse) {
        title = await generateTitleFromAIResponse(userMessage, aiResponse);
      } else {
        title = await generateTitleFromUserMessage(userMessage);
      }

      console.log('Generated title:', title);

      if (!title || title.trim() === '') {
        throw new Error('Generated title is empty');
      }
    } catch (titleError) {
      console.error('Title generation failed:', titleError);
      // Fallback to a simple title
      title =
        userMessage.length > 50
          ? `${userMessage.substring(0, 50)}...`
          : userMessage || 'New Chat';
    }

    // Update chat title in database
    try {
      await updateChatTitleById({ chatId, title });
      console.log('Title saved to database:', title);
    } catch (dbError) {
      console.error('Failed to save title to database:', dbError);
      // Continue anyway, the title was generated
    }

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error('Failed to generate chat title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 },
    );
  }
}
