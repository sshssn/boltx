import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { chat, message } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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

    // Get all messages for this chat
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt);

    // Create export data
    const exportData = {
      chat: {
        id: existingChat.id,
        title: existingChat.title,
        createdAt: existingChat.createdAt,
        visibility: existingChat.visibility,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      })),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    // Return as JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chat-${chatId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting chat:', error);
    return NextResponse.json(
      { error: 'Failed to export chat' },
      { status: 500 },
    );
  }
}
