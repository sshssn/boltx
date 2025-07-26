import { GoogleGenAI } from '@google/genai';
import { auth } from '@/app/(auth)/auth';
import {
  saveMessages,
  saveChat,
  getChatById,
  getMemoryByUserId,
  addMemory,
  getMessageCountByUserId,
  getChatsByUserId,
  updateChatTitleById,
} from '@/lib/db/queries';
import {
  generateTitleFromUserMessage,
  generateTitleFromAIResponse,
} from '@/lib/ai/title-generation';
import { generateUUID } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';
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
      entitlementsByUserType[userType]?.maxMessagesPerDay || 20;
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
      selectedChatModel,
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

    // Save user message first to ensure it's stored
    try {
      // Ensure the message has the correct structure
      const messageToSave: DBMessage = {
        id: userMessageToSave.id,
        chatId: userMessageToSave.chatId,
        role: userMessageToSave.role,
        parts: userMessageToSave.parts || [
          { type: 'text', text: userMessage.content || '' },
        ],
        attachments: userMessageToSave.attachments || [],
        createdAt: userMessageToSave.createdAt,
      };

      await saveMessages({ messages: [messageToSave] });
    } catch (error) {
      console.error('Failed to save user message to database:', error);
      // Continue with AI generation even if database fails
      // This could be due to database connection issues or schema problems
    }

    // Check/create chat with "New Thread" title initially
    let chatTitle = '';
    try {
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        // Create chat with "New Thread" title initially
        chatTitle = 'New Thread';
        console.log('Creating new chat with temporary title:', chatTitle);

        await saveChat({
          id: chatId,
          userId: session.user.id,
          title: chatTitle,
          visibility: selectedVisibilityType || 'private',
        });

        console.log('Chat created with temporary title:', chatTitle);
      } else {
        chatTitle = chat.title;
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
      // Use a fallback title
      chatTitle = 'New Thread';
    }

    // Initialize Gemini provider with fallback keys
    const { geminiProvider } = await import('@/lib/ai/providers');

    // Only fetch memory if user is a regular (logged-in) user
    let memoryItems: Array<{ content: string }> = [];
    if (session?.user && session.user.type === 'regular') {
      try {
        memoryItems = await getMemoryByUserId({
          userId: session.user.id,
          limit: 20,
        });
      } catch (error) {
        console.error('Failed to fetch memory:', error);
      }
    }

    // Prepare context for AI
    let contents: any[] = [];

    // Add memory context for regular users
    if (memoryItems.length > 0) {
      const memoryContext = memoryItems.map((item) => item.content).join('\n');
      contents.push({
        role: 'user',
        parts: [
          {
            text: `Here is some context about the user that you should remember and use in your responses:\n\n${memoryContext}\n\nNow, please respond to the user's message.`,
          },
        ],
      });
    }

    // Add conversation context
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
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    // Generate streaming response with better error handling
    let response: any;
    try {
      response = await geminiProvider.generateContentStream(
        selectedChatModel || 'gemini-2.0-flash-exp',
        config,
        contents,
      );
    } catch (error: any) {
      console.error('Chat API error:', error);

      // Handle specific Gemini API errors
      if (error.status === 429) {
        // Rate limit exceeded
        return new Response(
          JSON.stringify({
            error:
              'API rate limit exceeded. Please try again later or upgrade your plan.',
            details:
              'You have exceeded the daily request limit for the free tier.',
            retryAfter: error.details?.[0]?.retryDelay || '40s',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '40',
            },
          },
        );
      }

      if (error.status === 403) {
        // API key issues
        return new Response(
          JSON.stringify({
            error: 'API access denied. Please check your configuration.',
            details: 'Invalid or missing API key.',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Generic error response
      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable. Please try again.',
          details: error.message || 'Unknown error occurred',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Create assistant message for database
    const assistantMessageId = generateUUID();
    const assistantMessageToSave: DBMessage = {
      id: assistantMessageId,
      chatId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }], // Will be updated as stream progresses
      attachments: [],
      createdAt: new Date(),
    };

    // Save assistant message placeholder
    try {
      await saveMessages({ messages: [assistantMessageToSave] });
    } catch (error) {
      console.error('Failed to save assistant message:', error);
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          // Generate proper title when AI starts responding (first chunk)
          let titleGenerated = false;

          for await (const chunk of response) {
            // Handle different response formats
            let text = '';
            if (typeof chunk.text === 'function') {
              text = chunk.text();
            } else if (chunk.text) {
              text = chunk.text;
            } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              text = chunk.candidates[0].content.parts[0].text;
            }

            if (text) {
              // Generate title on first chunk (when AI starts responding)
              if (!titleGenerated) {
                try {
                  const userText =
                    userMessage.parts?.[0]?.text || userMessage.content || '';
                  const generatedTitle = await generateTitleFromUserMessage(
                    userText,
                    {
                      selectedModelId: selectedChatModel,
                    },
                  );

                  // Update chat title in database
                  await updateChatTitleById({
                    chatId,
                    title: generatedTitle,
                  });

                  console.log(
                    'Generated title when AI started responding:',
                    generatedTitle,
                  );
                  titleGenerated = true;
                } catch (error) {
                  console.error(
                    'Failed to generate title when AI started responding:',
                    error,
                  );
                }
              }

              fullResponse += text;
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ text })}\n\n`,
                ),
              );
            }
          }

          // Update the assistant message with full response
          try {
            await updateChatTitleById({
              chatId,
              title: chatTitle || 'New Chat',
            });
          } catch (error) {
            console.error('Failed to update chat title:', error);
          }

          try {
            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          } catch (controllerError) {
            console.error('Controller already closed:', controllerError);
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          try {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  error: 'Stream processing failed',
                  details:
                    error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`,
              ),
            );
          } catch (controllerError) {
            console.error(
              'Controller already closed during error:',
              controllerError,
            );
          }
        } finally {
          try {
            controller.close();
          } catch (closeError) {
            console.error('Controller already closed:', closeError);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Unexpected error in chat route:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
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
