import { auth } from '@/app/(auth)/auth';
import { getMessageUsageCount } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { getClientIP } from '@/lib/utils';
import { callGroq, convertToGroqFormat } from '@/lib/ai/groq-provider';
import { webSearch } from '@/lib/ai/tools/web-search';
import { getChatsByUserId } from '@/lib/db/queries';

// Validate environment variables
const validateEnvironment = () => {
  const requiredVars = [
    'GROQ_API_KEY',
    'OPENROUTER_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }
  return true;
};

// Rate limiting manager
class OpenRouterRateLimitManager {
  private rateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs = 60000; // 60 second window
  private readonly maxRequests = 50; // Increased requests per window

  isRateLimited(provider: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(provider);

    if (!limit) {
      return false;
    }

    if (now > limit.resetTime) {
      this.rateLimits.delete(provider);
      return false;
    }

    return limit.count >= this.maxRequests;
  }

  recordRequest(provider: string): void {
    const now = Date.now();
    const limit = this.rateLimits.get(provider);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(provider, {
        count: 1,
        resetTime: now + this.windowMs,
      });
    } else {
      limit.count++;
    }
  }

  recordRateLimit(provider: string): void {
    const now = Date.now();
    this.rateLimits.set(provider, {
      count: this.maxRequests,
      resetTime: now + this.windowMs,
    });
  }
}

const rateLimitManager = new OpenRouterRateLimitManager();

// Call OpenRouter API
const callOpenRouter = async (messages: any[], options: any = {}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const model = options.model || 'meta-llama/llama-3.1-8b-instruct:free';
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 800;

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://chat.vercel.ai',
        'X-Title': 'boltX Chat',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: options.stream || false,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  return response;
};

// Convert messages to OpenRouter format
const convertToOpenRouterFormat = (messages: any[]) => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
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
    const {
      id: chatId,
      messages: contextMessages,
      selectedVisibilityType,
      selectedChatModel: initialChatModel,
      continue: isContinueRequest = false,
    } = body;

    const selectedChatModel = initialChatModel;

    if (
      !chatId ||
      !contextMessages ||
      !Array.isArray(contextMessages) ||
      contextMessages.length === 0
    ) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: 'Missing required fields: id, messages',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Process messages and prepare for AI
    const messages = contextMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Check for web search mode
    const isWebSearchMode = messages.some((msg: any) =>
      msg.content?.toLowerCase().includes('[web search]'),
    );

    // Check for reasoning mode
    const isReasoningMode = messages.some((msg: any) =>
      msg.content?.toLowerCase().includes('[reasoning]'),
    );

    // AI identity instructions
    const aiIdentityInstructions = `You are boltX, an advanced AI assistant designed to help users with various tasks. You are helpful, creative, clever, and very friendly. You can help with coding, writing, analysis, and general conversation. Always provide accurate and helpful responses.`;

    // Prepare contents for AI
    const contents = messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ type: 'text', text: msg.content }],
    }));

    // Generate streaming response
    const generateStreamingResponse = async () => {
      let attempts = 0;
      const maxAttempts = 3;

      // If reasoning mode is enabled, use Groq with Llama3-70b
      if (isReasoningMode) {
        try {
          // Add system message to contents for Groq
          const groqContents = [
            {
              role: 'system',
              parts: [{ type: 'text', text: aiIdentityInstructions }],
            },
            ...contents,
          ];
          const groqMessages = convertToGroqFormat(groqContents);

          // Configure tools for web search if enabled
          const tools = isWebSearchMode ? [webSearch] : undefined;

          const response = await callGroq(groqMessages, {
            temperature: 0.8,
            maxTokens: 800,
            stream: true,
            topP: 0.9,
          });

          if (!response.body) {
            throw new Error('No response body from Groq');
          }

          return {
            stream: new ReadableStream({
              async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                  throw new Error('No response body reader from Groq');
                }
                const decoder = new TextDecoder();
                let hasContent = false;

                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                          if (!hasContent) {
                            console.error(
                              'Groq stream completed without content',
                            );
                            controller.error(
                              new Error('Groq stream returned no content'),
                            );
                            return;
                          }
                          controller.close();
                          return;
                        }

                        try {
                          const parsed = JSON.parse(data);
                          if (parsed.choices?.[0]?.delta?.content) {
                            const content = parsed.choices[0].delta.content;
                            if (content && content.trim() !== '') {
                              hasContent = true;
                              controller.enqueue({
                                type: 'text-delta',
                                delta: content,
                              });
                            }
                          }
                        } catch (parseError) {
                          // Ignore parse errors for incomplete chunks
                        }
                      }
                    }
                  }

                  if (!hasContent) {
                    console.error('Groq stream completed without any content');
                    controller.error(
                      new Error('Groq stream returned no content'),
                    );
                  }
                } catch (error) {
                  console.error('Groq stream error:', error);
                  controller.error(error);
                } finally {
                  reader.releaseLock();
                }
              },
            }),
          };
        } catch (error) {
          console.error('Groq reasoning mode error:', error);
          throw error;
        }
      }

      // Standard mode - try OpenRouter with fallback
      while (attempts < maxAttempts) {
        attempts++;
        const provider = attempts === 1 ? 'openrouter' : 'groq';

        try {
          if (provider === 'openrouter') {
            // Check rate limits
            if (rateLimitManager.isRateLimited('openrouter')) {
              throw new Error('OpenRouter rate limited');
            }

            const openRouterMessages = convertToOpenRouterFormat(messages);
            const response = await callOpenRouter(openRouterMessages, {
              model: 'meta-llama/llama-3.1-8b-instruct:free',
              temperature: 0.7,
              maxTokens: 800,
              stream: true,
            });

            rateLimitManager.recordRequest('openrouter');

            if (!response.body) {
              throw new Error('No response body from OpenRouter');
            }

            return {
              stream: new ReadableStream({
                async start(controller) {
                  const reader = response.body?.getReader();
                  if (!reader) {
                    throw new Error('No response body reader from OpenRouter');
                  }
                  const decoder = new TextDecoder();
                  let hasContent = false;

                  try {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;

                      const chunk = decoder.decode(value);
                      const lines = chunk.split('\n');

                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          const data = line.slice(6);
                          if (data === '[DONE]') {
                            if (!hasContent) {
                              console.error(
                                'OpenRouter stream completed without content',
                              );
                              controller.error(
                                new Error(
                                  'OpenRouter stream returned no content',
                                ),
                              );
                              return;
                            }
                            controller.close();
                            return;
                          }

                          try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                              const content = parsed.choices[0].delta.content;
                              if (content && content.trim() !== '') {
                                hasContent = true;
                                controller.enqueue({
                                  type: 'text-delta',
                                  delta: content,
                                });
                              }
                            }
                          } catch (parseError) {
                            // Ignore parse errors for incomplete chunks
                          }
                        }
                      }
                    }

                    if (!hasContent) {
                      console.error(
                        'OpenRouter stream completed without any content',
                      );
                      controller.error(
                        new Error('OpenRouter stream returned no content'),
                      );
                    }
                  } catch (error) {
                    console.error('OpenRouter stream error:', error);
                    controller.error(error);
                  } finally {
                    reader.releaseLock();
                  }
                },
              }),
            };
          } else {
            // Fallback to Groq
            const groqContents = [
              {
                role: 'system',
                parts: [{ type: 'text', text: aiIdentityInstructions }],
              },
              ...contents,
            ];
            const groqMessages = convertToGroqFormat(groqContents);

            const response = await callGroq(groqMessages, {
              temperature: 0.8,
              maxTokens: 800,
              stream: true,
              topP: 0.9,
            });

            if (!response.body) {
              throw new Error('No response body from Groq');
            }

            return {
              stream: new ReadableStream({
                async start(controller) {
                  const reader = response.body?.getReader();
                  if (!reader) {
                    throw new Error('No response body reader from Groq');
                  }
                  const decoder = new TextDecoder();
                  let hasContent = false;

                  try {
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;

                      const chunk = decoder.decode(value);
                      const lines = chunk.split('\n');

                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          const data = line.slice(6);
                          if (data === '[DONE]') {
                            if (!hasContent) {
                              console.error(
                                'Groq stream completed without content',
                              );
                              controller.error(
                                new Error('Groq stream returned no content'),
                              );
                              return;
                            }
                            controller.close();
                            return;
                          }

                          try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices?.[0]?.delta?.content) {
                              const content = parsed.choices[0].delta.content;
                              if (content && content.trim() !== '') {
                                hasContent = true;
                                controller.enqueue({
                                  type: 'text-delta',
                                  delta: content,
                                });
                              }
                            }
                          } catch (parseError) {
                            // Ignore parse errors for incomplete chunks
                          }
                        }
                      }
                    }

                    if (!hasContent) {
                      console.error(
                        'Groq stream completed without any content',
                      );
                      controller.error(
                        new Error('Groq stream returned no content'),
                      );
                    }
                  } catch (error) {
                    console.error('Groq stream error:', error);
                    controller.error(error);
                  } finally {
                    reader.releaseLock();
                  }
                },
              }),
            };
          }
        } catch (error) {
          console.error(`${provider} attempt ${attempts} failed:`, error);

          if (provider === 'openrouter') {
            rateLimitManager.recordRateLimit('openrouter');
          }

          if (attempts === maxAttempts) {
            throw new Error(
              `All providers failed. OpenRouter error: ${error instanceof Error ? error.message : 'Unknown error'}. Groq error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
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
            details: 'The request timed out after 12 seconds.',
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
            error:
              'AI service temporarily unavailable. Please try again later.',
            details: 'Configuration issue detected',
            retryable: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (
        error.message?.includes('quota') ||
        error.message?.includes('billing')
      ) {
        return new Response(
          JSON.stringify({
            error:
              'AI service temporarily unavailable. Please try again later.',
            details: 'Service temporarily overloaded',
            retryable: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (error.message?.includes('model') || error.status === 400) {
        return new Response(
          JSON.stringify({
            error:
              'AI service temporarily unavailable. Trying alternative model.',
            details: 'Model configuration issue',
            retryable: true,
          }),
          {
            status: 503,
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
            error: 'Network error. Please check your connection and try again.',
            details: 'Connection to AI service failed',
            retryable: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Generic error response
      return new Response(
        JSON.stringify({
          error: 'AI service temporarily unavailable. Please try again later.',
          details: error.message || 'Unknown error occurred',
          retryable: true,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const messageId = crypto.randomUUID();
        let fullResponse = '';

        try {
          // Send start message immediately
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`,
            ),
          );

          // Handle the response stream with immediate flushing
          if (response?.stream) {
            const reader = response.stream.getReader();
            let hasReceivedContent = false;

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value?.delta) {
                  hasReceivedContent = true;
                  fullResponse += value.delta;

                  // Send content immediately without buffering
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: value.delta })}\n\n`,
                    ),
                  );
                }
              }

              if (!hasReceivedContent) {
                throw new Error('No content received from AI service');
              }

              // Send completion message
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'text-done', id: messageId })}\n\n`,
                ),
              );
            } finally {
              if (reader) {
                reader.releaseLock();
              }
            }
          } else {
            // Fallback for non-streaming responses
            const fallbackResponse =
              "I'm having trouble generating a response. Please try again.";
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: fallbackResponse })}\n\n`,
              ),
            );
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'text-done', id: messageId })}\n\n`,
              ),
            );
          }
        } catch (error) {
          console.error('Stream controller error:', error);

          // Send error message
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'error', id: messageId, error: 'Internal server error' })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
