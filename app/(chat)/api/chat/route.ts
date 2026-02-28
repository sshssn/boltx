// @ts-nocheck
import { auth } from '@/app/(auth)/auth';
import {
  saveMessages,
  saveChat,
  getChatById,
  getMessageUsageCount,
  getMemoryByUserId,
} from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { authSecret } from '@/lib/constants';
import { getClientIP, generateUUID } from '@/lib/utils';
import { streamText, convertToModelMessages } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import type { DBMessage } from '@/lib/db/schema';
import { waitUntil } from '@vercel/functions';
import { redisClient } from '@/lib/redis';
import { createResumableStreamContext } from 'resumable-stream/redis';

// Validate environment variables
const validateEnvironment = () => {
  const missingCritical: string[] = [];
  if (!process.env.DATABASE_URL) missingCritical.push('DATABASE_URL');
  if (!authSecret) missingCritical.push('AUTH_SECRET');
  if (missingCritical.length > 0) {
    console.error('Missing critical environment variables:', missingCritical);
    return { valid: false, missing: missingCritical, type: 'critical' };
  }
  return { valid: true };
};

export async function POST(request: Request) {
  try {
    const validationResult = validateEnvironment();
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: `Missing environment variables: ${validationResult.missing.join(', ')}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const session = await auth();
    const clientIP = getClientIP(request);
    const today = new Date().toISOString().split('T')[0];

    // Rate limit enforcement
    let messagesUsed = 0;
    let messagesLimit = 20;

    if (session?.user) {
      const userType = session.user.type || 'guest';
      messagesLimit = entitlementsByUserType[userType]?.maxMessagesPerDay || 20;
      messagesUsed = await getMessageUsageCount({
        userId: session.user.id,
        date: today,
      });
    } else {
      if (!clientIP) return new Response('Unable to track usage', { status: 400 });
      messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay;
      messagesUsed = await getMessageUsageCount({
        ipAddress: clientIP,
        date: today,
      });
    }

    if (messagesUsed >= messagesLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily message limit reached. Please upgrade to continue.',
          limit: messagesLimit,
          used: messagesUsed,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = await request.json();
    const {
      id: chatId,
      messages: contextMessages,
      selectedChatModel,
      selectedVisibilityType,
    } = body;

    if (!chatId || !contextMessages || !Array.isArray(contextMessages) || contextMessages.length === 0) {
      return new Response('Invalid request format', { status: 400 });
    }

    const userMessage = contextMessages[contextMessages.length - 1];
    const userMessageToSave: DBMessage = {
      id: userMessage.id || generateUUID(),
      chatId,
      role: userMessage.role,
      parts: userMessage.parts || [{ type: 'text', text: userMessage.content || '' }],
      attachments: userMessage.attachments || [],
      createdAt: new Date(),
    };

    const dbOperations = (async () => {
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        const title = userMessage.parts?.[0]?.text || userMessage.content || 'New Chat';
        await saveChat({
          id: chatId,
          userId: session?.user?.id || 'guest',
          title: title.length > 80 ? `${title.substring(0, 77)}...` : title,
          visibility: selectedVisibilityType || 'private',
        });
      }
      await saveMessages({ messages: [userMessageToSave] });
    })();

    dbOperations.catch((error) => console.error('Database operation error:', error));

    let memoryItems: Array<{ content: string }> = [];
    if (session?.user && session.user.type === 'regular') {
      memoryItems = await getMemoryByUserId({ userId: session.user.id, limit: 20 });
    }

    const coreMessages = await convertToModelMessages(contextMessages);
    if (memoryItems.length > 0) {
      const memoryContext = memoryItems.map(m => m.content).join('\n');
      coreMessages.unshift({
        role: 'system',
        content: `User shared the following information in past conversations:\n${memoryContext}`,
      } as any);
    }

    const assistantMessageId = generateUUID();

    const result = await streamText({
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
  if (!id) return new Response('Bad Request', { status: 400 });
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  return new Response('OK', { status: 200 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
  try {
    const { chats } = await getChatById({ id: session.user.id }); // Using getChatById or similar for history
    return Response.json({ chats });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
