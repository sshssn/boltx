import { geminiProvider } from '@/lib/ai/providers';
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
  updateMessageById,
  getMessageUsageCount,
  createOrUpdateMessageUsage,
  createGuestUser,
} from '@/lib/db/queries';
import {
  generateTitleFromUserMessage,
  generateTitleFromAIResponse,
  updateThreadTitle,
} from '@/lib/ai/title-generation';
import { generateUUID, getClientIP } from '@/lib/utils';
import type { DBMessage } from '@/lib/db/schema';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

// Environment variable validation
const validateEnvironment = () => {
  const requiredVars = ['GEMINI_API_KEY'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  // Validate API key format
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && !apiKey.startsWith('AIza')) {
    console.warn('GEMINI_API_KEY may have invalid format');
  }

  return true;
};

export async function POST(request: Request) {
  try {
    // Validate environment
    if (!validateEnvironment()) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing or invalid environment variables',
          retryable: false,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check authentication
    const session = await auth();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Rate limit enforcement with robust tracking
    let messagesUsed = 0;
    let messagesLimit = 20; // Default guest limit

    if (session?.user) {
      // Logged-in user
      const userType = session.user.type || 'guest';
      messagesLimit = entitlementsByUserType[userType]?.maxMessagesPerDay || 20;

      // Get usage from database
      messagesUsed = await getMessageUsageCount({
        userId: session.user.id,
        date: today,
      });
    } else {
      // Guest user - track by IP
      if (!clientIP) {
        return new Response(
          JSON.stringify({
            error: 'Unable to track usage. Please try again.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay;
      messagesUsed = await getMessageUsageCount({
        ipAddress: clientIP,
        date: today,
      });
    }

    // Check if user has exceeded their limit with strict validation
    if (messagesUsed >= messagesLimit) {
      return new Response(
        JSON.stringify({
          error: 'Daily message limit reached. Please upgrade to continue.',
          details: `You have used ${messagesUsed}/${messagesLimit} messages today.`,
          limit: messagesLimit,
          used: messagesUsed,
          retryable: false,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': messagesLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      );
    }

    // Extract the request body
    const body = await request.json();
    console.log('Request body:', body);

    const {
      id: chatId,
      messages: contextMessages,
      selectedVisibilityType,
      selectedChatModel: initialChatModel,
    } = body;

    let selectedChatModel = initialChatModel;

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
      id: generateUUID(), // Always generate a new UUID on the server
      chatId,
      role: userMessage.role,
      parts: userMessage.parts || [
        { type: 'text', text: userMessage.content || '' },
      ],
      attachments: userMessage.attachments || [],
      createdAt: new Date(),
    };

    // --- FACT EXTRACTION AND MEMORY SAVE ---
    if (session?.user?.type === 'regular') {
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
            content: `The user's name is ${name}`,
          });
        }
      }
    }
    // --- END FACT EXTRACTION ---

    // Check/create chat with "New Thread" title initially
    let chatTitle = '';
    let chatExists = false;
    try {
      const chat = await getChatById({ id: chatId });
      if (!chat) {
        // Generate title immediately for better UX
        try {
          const { generateTitleFromUserMessage } = await import(
            '@/lib/ai/title-generation'
          );
          chatTitle = await generateTitleFromUserMessage(
            userMessage.content || 'New conversation',
          );
          console.log('Generated title immediately:', chatTitle);
        } catch (error) {
          console.error('Failed to generate title immediately:', error);
          chatTitle = 'New Thread';
        }
        console.log('Creating new chat with title:', chatTitle);

        // For guest users, create a temporary guest user
        const userId = session?.user?.id;

        if (!userId) {
          // Create a temporary guest user for this chat
          try {
            const guestUser = await createGuestUser();
            if (guestUser?.[0]) {
              await saveChat({
                id: chatId,
                userId: guestUser[0].id,
                title: chatTitle,
                visibility: selectedVisibilityType || 'private',
              });
              console.log('Chat created with temporary guest user:', chatTitle);
              chatExists = true;
            }
          } catch (error) {
            console.error('Failed to create guest user or chat:', error);
            // Continue without chat creation for guests
          }
        } else {
          await saveChat({
            id: chatId,
            userId,
            title: chatTitle,
            visibility: selectedVisibilityType || 'private',
          });
          console.log('Chat created with temporary title:', chatTitle);
          chatExists = true;
        }
      } else {
        chatTitle = chat.title;
        chatExists = true;
      }
    } catch (error) {
      console.error('Failed to save chat:', error);
      // Use a fallback title
      chatTitle = 'New Thread';
    }

    // Save user message AFTER chat is created to avoid foreign key constraint
    try {
      // Save messages for both logged-in users and guests (if chat was created)
      if (chatExists) {
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
      } else {
        console.log('Chat not created - skipping message save to database');
      }
    } catch (error) {
      console.error('Failed to save user message to database:', error);
      // Continue with AI generation even if database fails
      // This could be due to database connection issues or schema problems
      // Don't throw here to allow the chat to continue
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

    // Add conversation context (limit to last 8 messages for balanced speed)
    const recentMessages = contextMessages.slice(-8);
    contents = [
      ...contents,
      ...recentMessages.map((msg) => ({
        role: msg.role,
        parts: msg.parts?.map((p: any) => ({ text: p.text || '' })) || [
          { text: msg.content || '' },
        ],
      })),
    ];

    console.log('Converted contents:', contents);

    // Configure the model for balanced speed and quality
    const config = {
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking for speed
      },
      generationConfig: {
        temperature: 0.9, // Higher temperature for faster responses
        topK: 40, // Balanced for quality
        topP: 0.9, // Balanced for quality
        maxOutputTokens: 800, // Reasonable token limit
        candidateCount: 1, // Only generate one response
        stopSequences: [], // No stop sequences for speed
      },
    };

    // Generate streaming response with improved error handling and retry logic
    const generateStreamingResponse = async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Use supported model with fallback
          const modelName = selectedChatModel || 'gemini-1.5-flash';
          const model = geminiProvider.languageModel(modelName);

          // Add timeout to prevent hanging requests
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000); // Reduced timeout for faster feedback
          });

          const streamPromise = model.doStream({
            inputFormat: 'messages',
            mode: { type: 'regular' },
            prompt: contents.map((msg) => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user', // Ensure valid roles
              content: msg.parts.map((p: any) => ({
                type: 'text',
                text: p.text || '',
              })),
            })),
            temperature: config.generationConfig.temperature,
            maxTokens: config.generationConfig.maxOutputTokens,
            topK: config.generationConfig.topK,
            topP: config.generationConfig.topP,
          });

          return await Promise.race([streamPromise, timeoutPromise]);
        } catch (error: any) {
          attempts++;
          console.error(`Streaming attempt ${attempts} failed:`, error.message);

          // Handle specific errors
          if (error.status === 400 && error.message?.includes('model')) {
            // Try fallback model
            selectedChatModel = 'gemini-1.5-flash';
            continue;
          }

          if (error.status === 429 && attempts < maxAttempts) {
            // Wait and retry for rate limits
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced retry delay for faster recovery
            continue;
          }

          if (attempts >= maxAttempts) {
            throw error;
          }
        }
      }
    };

    let response: any;
    try {
      response = await generateStreamingResponse();
    } catch (error: any) {
      console.error('Chat API error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Enhanced error handling with better categorization
      if (error.message === 'Request timeout') {
        return new Response(
          JSON.stringify({
            error: 'AI response took too long. Please try again.',
            details: 'The request timed out after 15 seconds.',
            retryable: true,
          }),
          {
            status: 408,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (error.message?.includes('API key') || error.status === 403) {
        return new Response(
          JSON.stringify({
            error: 'API configuration error. Please check your setup.',
            details: 'Invalid or missing API key',
            retryable: false,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (error.message?.includes('model') || error.status === 400) {
        return new Response(
          JSON.stringify({
            error: 'Model configuration error. Trying fallback model.',
            details: 'Unsupported model or invalid parameters',
            retryable: true,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (error.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait before trying again.',
            details: 'Too many requests to the AI service',
            retryAfter: '60s',
            retryable: true,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          },
        );
      }

      // Network or connection errors
      if (
        error.message?.includes('network') ||
        error.message?.includes('fetch')
      ) {
        return new Response(
          JSON.stringify({
            error:
              'Network connection failed. Please check your internet and try again.',
            details: 'Unable to connect to AI service.',
            retryable: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Default error response
      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable',
          details: error.message || 'Unknown error occurred',
          retryable: true,
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
      // Save for both logged-in users and guests (if chat was created)
      if (chatExists) {
        await saveMessages({ messages: [assistantMessageToSave] });
      } else {
        console.log(
          'Chat not created - skipping assistant message save to database',
        );
      }
    } catch (error) {
      console.error('Failed to save assistant message:', error);
      // Continue without saving assistant message if database fails
    }

    // Increment message usage count AFTER successful AI response starts
    try {
      if (session?.user) {
        await createOrUpdateMessageUsage({
          userId: session.user.id,
          date: today,
          increment: 1,
        });
      } else if (clientIP) {
        await createOrUpdateMessageUsage({
          ipAddress: clientIP,
          userAgent,
          date: today,
          increment: 1,
        });
      }
    } catch (error) {
      console.error('Failed to update message usage:', error);
      // Continue even if usage tracking fails
    }

    // Create streaming response using AI SDK format with optimized headers
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let controllerClosed = false;
        const messageId = generateUUID();

        try {
          // Generate proper title when AI starts responding (first chunk)
          let titleGenerated = false;

          // Send start message using AI SDK format
          if (!controllerClosed) {
            try {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`,
                ),
              );
            } catch (enqueueError) {
              console.error('Failed to enqueue start message:', enqueueError);
              controllerClosed = true;
            }
          }

          // Handle the response stream properly with improved error handling
          if (response?.stream) {
            const reader = response.stream.getReader();

            try {
              while (!controllerClosed) {
                const { done, value } = await reader.read();
                if (done) break;

                let text = '';

                // Handle different response formats
                if (value?.type === 'text-delta' && value.delta) {
                  text = value.delta;
                } else if (value?.type === 'text-delta' && value.textDelta) {
                  text = value.textDelta;
                } else if (typeof value?.text === 'string') {
                  text = value.text;
                } else if (typeof value?.text === 'function') {
                  text = value.text();
                } else if (value?.candidates?.[0]?.content?.parts?.[0]?.text) {
                  text = value.candidates[0].content.parts[0].text;
                }

                if (text && !controllerClosed) {
                  // Send text immediately without buffering for faster streaming
                  if (!controllerClosed) {
                    try {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: text })}\n\n`,
                        ),
                      );
                    } catch (enqueueError) {
                      console.error(
                        'Failed to enqueue text delta:',
                        enqueueError,
                      );
                      controllerClosed = true;
                    }
                  }

                  fullResponse += text;

                  // Generate title on first chunk (when AI starts responding) - moved after sending text
                  if (!titleGenerated && chatId) {
                    try {
                      const userText =
                        userMessage.parts?.[0]?.text ||
                        userMessage.content ||
                        '';
                      const generatedTitle = await generateTitleFromUserMessage(
                        userText,
                        {
                          selectedModelId: selectedChatModel,
                        },
                      );

                      // Update chat title in database for both logged-in users and guests
                      await updateChatTitleById({
                        chatId,
                        title: generatedTitle,
                      });

                      // Notify UI components about the title update
                      updateThreadTitle(chatId, generatedTitle);

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
                      // Continue without title generation if it fails
                    }
                  }
                }
              }
            } catch (streamError) {
              console.error('Stream reading error:', streamError);
            } finally {
              if (reader) {
                reader.releaseLock();
              }
            }
          } else {
            // Handle non-streaming response
            console.warn(
              'Response is not a stream, handling as regular response',
            );
            if (response?.response?.text) {
              const text = response.response.text();
              if (text && !controllerClosed) {
                fullResponse = text;
                try {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: text })}\n\n`,
                    ),
                  );
                } catch (enqueueError) {
                  console.error(
                    'Failed to enqueue non-streaming text:',
                    enqueueError,
                  );
                  controllerClosed = true;
                }
              }
            }
          }

          // Update the assistant message with full response
          if (fullResponse && assistantMessageId) {
            try {
              // Update for both logged-in users and guests
              await updateMessageById({
                messageId: assistantMessageId,
                content: fullResponse,
              });
            } catch (error) {
              console.error('Failed to update assistant message:', error);
              // Continue even if update fails
            }
          }

          // Update chat title if not already updated
          if (!titleGenerated && chatId) {
            try {
              // Update for both logged-in users and guests
              await updateChatTitleById({
                chatId,
                title: chatTitle || 'New Chat',
              });
            } catch (error) {
              console.error('Failed to update chat title:', error);
              // Continue even if title update fails
            }
          }

          // Validate response quality
          if (fullResponse.trim().length < 10) {
            console.warn('Generated response too short:', fullResponse);
            throw new Error('Generated response too short');
          }

          // Send text-end message
          if (!controllerClosed) {
            try {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text-end', id: messageId })}\n\n`,
                ),
              );
            } catch (enqueueError) {
              console.error(
                'Failed to enqueue text-end message:',
                enqueueError,
              );
              controllerClosed = true;
            }
          }

          // Send completion signal
          if (!controllerClosed) {
            try {
              controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
              controller.close();
              controllerClosed = true;
            } catch (enqueueError) {
              console.error(
                'Failed to enqueue completion signal:',
                enqueueError,
              );
              controllerClosed = true;
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          if (!controllerClosed) {
            try {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    type: 'error',
                    errorText:
                      error instanceof Error ? error.message : 'Unknown error',
                  })}\n\n`,
                ),
              );
              controller.close();
              controllerClosed = true;
            } catch (controllerError) {
              console.error(
                'Controller already closed during error:',
                controllerError,
              );
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Transfer-Encoding': 'chunked',
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
