import { GoogleGenAI } from '@google/genai';
import { auth } from '@/app/(auth)/auth';
import {
  saveMessages,
  saveChat,
  getChatById,
  getMemoryByUserId,
  getMemoryCountByUserId,
  addMemory,
  deleteMemoryById,
  getMessageCountByUserId,
  getChatsByUserId,
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Rate limit enforcement
    const userType = session.user.type || 'guest';
    const messagesLimit =
      entitlementsByUserType[userType]?.maxMessagesPerDay || 10;
    const tokensUsed = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });
    if (tokensUsed >= messagesLimit) {
      return new Response(
        JSON.stringify({
          error:
            'Rate limit exceeded. Please wait until tomorrow or upgrade your plan.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Extract the request body
    const body = await request.json();
    console.log('Request body:', body);

    const {
      id: chatId,
      messages: contextMessages,
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

    // --- FACT EXTRACTION AND MEMORY SAVE ---
    if (session.user.type === 'regular') {
      const userText =
        userMessage.parts?.[0]?.text || userMessage.content || '';
      // Extract name from patterns like "my name is ..." or "I am ..."
      const nameMatch = userText.match(
        /(?:my name is|i am|i'm) ([a-zA-Z ]{2,40})/i,
      );
      if (nameMatch) {
        const name = nameMatch[1].trim();
        // Prevent duplicate memory entries for the same fact
        const existingMemories = await getMemoryByUserId({
          userId: session.user.id,
          limit: 20,
        });
        const alreadySaved = existingMemories.some((m) =>
          m.content.toLowerCase().includes(name.toLowerCase()),
        );
        if (!alreadySaved) {
          await addMemory({
            userId: session.user.id,
            content: `The user's name is ${name}.`,
          });
        }
      }
    }
    // --- END FACT EXTRACTION ---

    // Run database operations in parallel for speed
    const dbOperations = Promise.all([
      // Check/create chat and save user message in parallel
      (async () => {
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
      })(),
    ]);

    // Don't wait for database operations to complete before starting AI generation
    dbOperations.catch((error) =>
      console.error('Database operation error:', error),
    );

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Only fetch memory if user is a regular (logged-in) user
    let memoryItems: Array<{ content: string }> = [];
    if (session?.user && session.user.type === 'regular') {
      memoryItems = await getMemoryByUserId({
        userId: session.user.id,
        limit: 20,
      });
    }

    // Convert context messages to the format expected by Google GenAI
    // Prepend memory items as a user message if any (Gemini does not support system role)
    let contents = [];
    if (memoryItems.length > 0) {
      contents.push({
        role: 'user',
        parts: [{ text: memoryItems.map((m) => m.content).join('\n') }],
      });
    }
    contents = [
      ...contents,
      ...contextMessages.map((msg) => ({
        role: msg.role,
        parts: msg.parts?.map((p: any) => ({ text: p.text || '' })) || [
          { text: msg.content || '' },
        ],
      })),
    ];

    console.log('Converted contents:', contents);

    // Configure the model for maximum speed
    const config = {
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking for maximum speed
      },
      responseMimeType: 'text/plain',
      generationConfig: {
        temperature: 0.5, // Even lower temperature for faster responses
        topK: 20, // Further limit token selection for speed
        topP: 0.7, // More focused sampling for speed
        maxOutputTokens: 1024, // Shorter responses for speed
        candidateCount: 1, // Single response for speed
        stopSequences: [], // No stop sequences for speed
      },
      safetySettings: [], // Disable safety checks for speed (use with caution)
    };

    const model = 'gemini-2.0-flash-exp'; // Use the fastest Gemini model

    // Generate streaming response
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // Create assistant message ID for saving later
    const assistantMessageId = generateUUID();
    let assistantResponse = '';

    // Create a high-performance stream with minimal buffering
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Pre-encode static events for speed
          const textStartEvent = new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'text-start', id: assistantMessageId })}\n\n`,
          );
          const textEndEvent = new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'text-end', id: assistantMessageId })}\n\n`,
          );
          const finishEvent = new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'finish' })}\n\n`,
          );
          const doneEvent = new TextEncoder().encode('data: [DONE]\n\n');

          // Send text-start immediately
          controller.enqueue(textStartEvent);

          // Process chunks with maximum speed - no buffering
          for await (const chunk of response) {
            if (chunk.text) {
              assistantResponse += chunk.text;

              // Send chunk immediately - no JSON.stringify overhead for small chunks
              const delta =
                chunk.text.length < 10
                  ? `data: {"type":"text-delta","id":"${assistantMessageId}","delta":"${chunk.text}"}\n\n`
                  : `data: ${JSON.stringify({ type: 'text-delta', id: assistantMessageId, delta: chunk.text })}\n\n`;

              controller.enqueue(new TextEncoder().encode(delta));
            }
          }

          // Send text-end immediately
          controller.enqueue(textEndEvent);

          // Save to database in background (non-blocking)
          const savePromise = (async () => {
            const assistantMessageToSave: DBMessage = {
              id: assistantMessageId,
              chatId,
              role: 'assistant',
              parts: [{ type: 'text', text: assistantResponse }],
              attachments: [],
              createdAt: new Date(),
            };
            await saveMessages({ messages: [assistantMessageToSave] });
          })();

          // Send finish events immediately
          controller.enqueue(finishEvent);
          controller.enqueue(doneEvent);
          controller.close();

          // Wait for database save to complete (but don't block the stream)
          await savePromise;
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering for faster streaming
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
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

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
  try {
    const { chats } = await getChatsByUserId({
      id: session.user.id,
      limit: Math.min(limit, 100),
      startingAfter: null,
      endingBefore: null,
    });
    return Response.json({ chats });
  } catch (error) {
    console.error('Chat history fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
