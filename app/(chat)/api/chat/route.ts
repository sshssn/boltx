// @ts-nocheck
import { auth } from '@/app/(auth)/auth';
import {
  saveMessages,
  saveChat,
  getChatById,
  getMemoryByUserId,
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';
import { streamText, convertToModelMessages } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract the request body
    const body = await request.json();
    const {
      id: chatId,
      messages: contextMessages,
      selectedChatModel,
      selectedVisibilityType,
    } = body;

    if (
      !chatId ||
      !contextMessages ||
      !Array.isArray(contextMessages) ||
      contextMessages.length === 0
    ) {
      return new Response('Missing required fields', { status: 400 });
    }

    // The last message is the new user message
    const userMessage = contextMessages[contextMessages.length - 1];
    const userMessageToSave: DBMessage = {
      id: userMessage.id || generateUUID(),
      chatId,
      role: userMessage.role,
      parts: userMessage.parts || [
        { type: 'text', text: userMessage.content || '' },
      ],
      attachments: userMessage.attachments || [],
      createdAt: new Date(),
    };

    // Run database operations in parallel
    const dbOperations = (async () => {
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        const title =
          userMessage.parts?.[0]?.text || userMessage.content || 'New Chat';
        await saveChat({
          id: chatId,
          userId: session.user.id,
          title: title.length > 80 ? `${title.substring(0, 77)}...` : title,
          visibility: selectedVisibilityType || 'private',
        });
      }
      await saveMessages({ messages: [userMessageToSave] });
    })();

    dbOperations.catch((error) =>
      console.error('Database operation error:', error),
    );

    // Only fetch memory if user is a regular (logged-in) user
    let memoryItems: Array<{ content: string }> = [];
    if (session?.user && session.user.type === 'regular') {
      memoryItems = await getMemoryByUserId({
        userId: session.user.id,
        limit: 20,
      });
    }

    const coreMessages = await convertToModelMessages(contextMessages);
    
    // Add memory context as a system message if present
    if (memoryItems.length > 0) {
      const memoryContext = memoryItems.map(m => m.content).join('\n');
      coreMessages.unshift({
        role: 'system',
        content: `User shared the following information in past conversations:\n${memoryContext}`,
      } as any);
    }

    const assistantMessageId = generateUUID();

    const result = streamText({
      model: myProvider.languageModel(selectedChatModel || 'gpt-5.1'),
      messages: coreMessages as any,
      tools: {
        generateImage: (await import('@/lib/ai/tools/generate-image')).generateImage,
      },
      onFinish: async ({ text }) => {
        const assistantMessageToSave: DBMessage = {
          id: assistantMessageId,
          chatId,
          role: 'assistant',
          parts: [{ type: 'text', text }],
          attachments: [],
          createdAt: new Date(),
        };
        await saveMessages({ messages: [assistantMessageToSave] });
      },
    });

    return (result as any).toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

import { createResumableStreamContext } from 'resumable-stream/redis';
import { redisClient } from '@/lib/redis';
import { waitUntil } from '@vercel/functions';

export function getStreamContext() {
  return createResumableStreamContext({
    publisher: redisClient as any,
    subscriber: redisClient.duplicate() as any,
    waitUntil,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Bad Request', { status: 400 });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // For now, just return success since we're not using the database
  return new Response('OK', { status: 200 });
}
