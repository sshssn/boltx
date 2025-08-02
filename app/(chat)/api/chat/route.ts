import { geminiProvider } from '@/lib/ai/providers';
import { auth } from '@/app/(auth)/auth';
import { webSearch } from '@/lib/ai/tools/web-search';
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
  const requiredVars = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  // Validate API key format
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && !geminiApiKey.startsWith('AIza')) {
    console.warn('GEMINI_API_KEY may have invalid format');
  }

  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey && openRouterApiKey.length < 10) {
    console.warn('OPENROUTER_API_KEY may have invalid format');
  }

  return true;
};

// Rate limiting manager for OpenRouter
class OpenRouterRateLimitManager {
  private rateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs = 60000; // 60 second window
  private readonly maxRequests = 50; // Increased requests per window

  isRateLimited(provider: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(provider);

    if (!limit) return false;

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

// OpenRouter API call function with improved error handling and multiple API key support
const callOpenRouter = async (messages: any[], options: any = {}) => {
  // Try multiple OpenRouter API keys
  const openRouterKeys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter((key) => key && key.trim() !== '');

  if (openRouterKeys.length === 0) {
    throw new Error('No OpenRouter API keys configured');
  }

  // Determine model first - prioritize speed for coding
  const model =
    options.reasoning || options.model === 'deepseek-r1'
      ? 'deepseek/deepseek-r1-0528:free'
      : options.model || 'qwen/qwen3-coder:free'; // Fastest available coding model

  // Select the appropriate key based on the model
  let selectedKeyIndex = 0; // Default to key 1 (Qwen)

  if (model.includes('deepseek-r1')) {
    // Use key 2 for DeepSeek R1
    selectedKeyIndex = 1;
    if (openRouterKeys.length <= 1) {
      throw new Error(
        'DeepSeek R1 requires OPENROUTER_API_KEY_2 but it is not configured',
      );
    }
  } else {
    // Use key 1 for Qwen
    selectedKeyIndex = 0;
  }

  // Check if the selected key is rate limited
  if (rateLimitManager.isRateLimited(`openrouter-${selectedKeyIndex}`)) {
    throw new Error(
      `OpenRouter key ${selectedKeyIndex + 1} (for ${model.split('/')[1]}) is rate limited - please wait before trying again`,
    );
  }

  const openRouterApiKey = openRouterKeys[selectedKeyIndex];
  console.log(
    `Using OpenRouter API key ${selectedKeyIndex + 1} for ${model.split('/')[1]}...`,
  );

  // Record this request attempt
  rateLimitManager.recordRequest(`openrouter-${selectedKeyIndex}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3s for faster response

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_SITE_URL || 'https://boltX.com',
          'X-Title': 'boltX',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: options.temperature || 0.8, // Increased for more creative and varied responses
          max_tokens: options.maxTokens || 600, // Good length for coding help
          stream: options.stream || false,
          top_p: 0.9, // Higher for better coding responses
          frequency_penalty: 0,
          presence_penalty: 0,
          logit_bias: null, // Disable logit bias for speed
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (response.status === 429) {
      rateLimitManager.recordRateLimit(`openrouter-${selectedKeyIndex}`);
      throw new Error(
        `OpenRouter key ${selectedKeyIndex + 1} (for ${model.split('/')[1]}) is rate limited - please wait before trying again`,
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `OpenRouter API key ${selectedKeyIndex + 1} error response:`,
        errorText,
      );
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
      );
    }

    console.log(`OpenRouter API key ${selectedKeyIndex + 1} succeeded!`);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('OpenRouter API timeout - request took too long');
    }
    throw error;
  }
};

// Convert messages to OpenRouter format
const convertToOpenRouterFormat = (messages: any[]) => {
  return messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.parts?.[0]?.text || msg.content || '',
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
    // Request body processed

    const {
      id: chatId,
      messages: contextMessages,
      selectedVisibilityType,
      selectedChatModel: initialChatModel,
      continue: isContinueRequest = false, // New flag for continue requests
    } = body;

    // Context messages processed

    const selectedChatModel = initialChatModel;

    if (
      !chatId ||
      !contextMessages ||
      !Array.isArray(contextMessages) ||
      contextMessages.length === 0
    ) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Extract user message and check for reasoning mode
    const userMessage = contextMessages[contextMessages.length - 1];
    const isReasoningMode = userMessage?.metadata?.reasoning === true;
    const preferredModel = userMessage?.metadata?.preferredModel;
    // Check if this is a continuation request
    const isContinuation =
      userMessage?.metadata?.isContinuation === true || isContinueRequest;
    const originalMessageId = userMessage?.metadata?.originalMessageId;
    const isWebSearchMode = userMessage?.metadata?.webSearch === true;

    // Restrict web search to logged-in users only
    if (isWebSearchMode && !session?.user) {
      return new Response(
        JSON.stringify({
          error:
            'Web search is only available for logged-in users. Please sign in to use this feature.',
          details: 'Authentication required for web search functionality',
          retryable: false,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Request parameters processed

    // Add AI identity instructions
    let aiIdentityInstructions = `You are a helpful AI assistant. Be concise and informative.`;

    // Add web search instructions if web search mode is enabled
    if (isWebSearchMode) {
      const userText =
        userMessage.parts?.[0]?.text || userMessage.content || '';

      // Call Brave API directly for web search
      try {
        // Import the direct web search function
        const { performWebSearch } = await import('@/lib/ai/tools/web-search');

        // Call the direct web search function
        const searchResponse = await performWebSearch({
          query: userText,
          searchType: 'web',
          limit: 10,
          safeSearch: true,
          userId: session?.user?.id || 'guest',
        });

        if (searchResponse.results && searchResponse.results.length > 0) {
          // Format search results for the AI
          const searchResults = searchResponse.results
            .map(
              (result, index) =>
                `${index + 1}. ${result.title}\n   URL: ${result.url}\n   Summary: ${result.snippet}`,
            )
            .join('\n\n');

          aiIdentityInstructions += `\n\nWEB SEARCH RESULTS FOR: "${userText}"

${searchResults}

IMPORTANT: Use the above search results to provide accurate, up-to-date information. Format your response with sources using the [Source: Title - URL] format.

RESPONSE PATTERN - FOLLOW THIS EXACTLY:

1. **RESEARCH CONTENT FIRST**: Provide comprehensive analysis and information based on your search results
2. **SOURCES FORMAT**: Use the exact format that works with the markdown component's source extraction

FORMAT YOUR RESPONSE LIKE THIS:
[Your comprehensive research content here...]

[Source: Title from search results - URL from search results]
[Source: Title from search results - URL from search results]
[Source: Title from search results - URL from search results]

CRITICAL RULES:
- Use the format: [Source: Title - URL]
- Extract title and URL from the search results above
- The markdown component will automatically detect this pattern and create the sources container
- This works globally across all chats, not just web search
- The sources will appear in a beautiful container with favicons and modal functionality
- DO NOT use markdown links [Title](URL) - use the [Source: Title - URL] format instead
- DO NOT show [object Object] or raw data - extract the actual title and URL values
- IMPORTANT: Only include sources that have valid URLs (starting with http/https)
- If a source has no valid URL, skip it and don't include it
- Make sure to extract the actual title text and URL string, not the object reference`;
        } else {
          aiIdentityInstructions += `\n\nWEB SEARCH: No recent results found for "${userText}". Please provide general information and note that web search didn't return specific results.`;
        }
      } catch (error) {
        console.error('Web search error:', error);
        aiIdentityInstructions += `\n\nWEB SEARCH: Unable to perform web search due to an error. Please provide general information.`;
      }
    }

    // Add continuation instructions if this is a continuation request
    if (isContinuation) {
      aiIdentityInstructions += `\n\nIMPORTANT: The user is asking you to continue from where you left off in your previous response. Please continue seamlessly from where you stopped, maintaining the same tone and style. Do not repeat what you already said, just continue naturally. If you were in the middle of explaining something, continue that explanation. If you were listing items, continue the list. If you were providing examples, continue with more examples.`;
    }

    // The last message is the new user message
    const userMessageToSave: DBMessage = {
      id: generateUUID(), // Always generate a new UUID on the server
      chatId: chatId,
      role: 'user',
      parts: userMessage.parts,
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
            {
              maxLength: 40,
              style: 'concise',
            },
          );
          // Title generated immediately
        } catch (error) {
          console.error('Failed to generate title immediately:', error);
          // Use a better fallback title based on user message
          const userText =
            userMessage.content || userMessage.parts?.[0]?.text || '';
          if (userText.length > 0) {
            // Extract first few meaningful words as fallback
            const words = userText.split(' ').slice(0, 3).join(' ');
            chatTitle = words.length > 0 ? words : 'New Chat';
          } else {
            chatTitle = 'New Chat';
          }
        }
        // Creating new chat

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
              // Chat created with temporary guest user
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
          // Chat created with temporary title
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
        // Chat not created - skipping message save
      }
    } catch (error) {
      console.error('Failed to save user message to database:', error);
      // Continue with AI generation even if database fails
      // This could be due to database connection issues or schema problems
      // Don't throw here to allow the chat to continue
    }

    // Initialize providers
    const { geminiProvider } = await import('@/lib/ai/providers');
    const { callGroq, convertToGroqFormat } = await import(
      '@/lib/ai/groq-provider'
    );

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

    // Add conversation context (limit to last 6 messages for coding context)
    const recentMessages = contextMessages.slice(-6);
    contents = [
      ...contents,
      ...recentMessages.map((msg) => {
        // Ensure we have valid parts
        let parts = msg.parts || [];

        // If parts is undefined or empty, try to extract from content
        if (!parts || parts.length === 0) {
          if (msg.content) {
            parts = [{ text: msg.content }];
          } else if (typeof msg === 'string') {
            parts = [{ text: msg }];
          } else {
            console.warn('Message has no content or parts:', msg);
            parts = [{ text: 'Empty message' }];
          }
        }

        // Handle web search mode for the last user message
        const isLastUserMessage = msg === userMessage;
        const messageText = parts
          .map((p: any) => p.text || p.content || '')
          .join(' ');

        return {
          role: msg.role || 'user',
          parts: parts.map((p: any) => ({
            type: 'text',
            text: p.text || p.content || '',
          })),
        };
      }),
    ];

    // Contents converted for AI processing

    // Configure the model for more creative and responsive AI assistance
    const config = {
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking for speed
      },
      generationConfig: {
        temperature: 0.8, // Increased for more creative and varied responses
        topK: 20, // Balanced for speed and quality
        topP: 0.9, // Higher for more diverse responses
        maxOutputTokens: 800, // Proper length for coding help
        candidateCount: 1, // Only generate one response
        stopSequences: [], // No stop sequences for speed
      },
    };

    // Generate streaming response with improved error handling and retry logic
    const generateStreamingResponse = async () => {
      let attempts = 0;
      const maxAttempts = 3; // Reduced for cleaner fallback logic

      // If reasoning mode is enabled, use Groq with Llama3-70b
      if (isReasoningMode) {
        // Reasoning mode enabled - using Groq with Llama3-70b
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
            temperature: config.generationConfig.temperature,
            maxTokens: config.generationConfig.maxOutputTokens,
            stream: true,
            topP: config.generationConfig.topP,
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
                              // Send content immediately without buffering
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
                } catch (streamError: any) {
                  console.error('Groq stream processing error:', streamError);
                  controller.error(streamError);
                } finally {
                  reader.releaseLock();
                }
              },
            }),
          };
        } catch (error: any) {
          attempts++;
          console.error(`Groq attempt ${attempts} failed:`, error.message);

          // If this is the last attempt, try Gemini fallback
          if (attempts >= maxAttempts) {
            console.log('Groq failed, trying Gemini fallback...');
            try {
              // Use Gemini Flash as fallback model
              const modelName = 'gemini-2.0-flash-exp';
              console.log('Using Gemini Flash model as fallback:', modelName);
              const model = geminiProvider.languageModel(modelName);

              // Add timeout to prevent hanging requests
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 8000); // Reduced from 12s to 8s
              });

              // Add AI identity instructions to the prompt
              const enhancedContents = [
                {
                  role: 'system' as const,
                  parts: [{ type: 'text', text: aiIdentityInstructions }],
                },
                ...contents,
              ];

              // Validate and prepare the prompt
              const prompt = enhancedContents.map((msg) => {
                try {
                  // Ensure we have valid parts
                  const parts = msg.parts || [];
                  if (parts.length === 0 && msg.content) {
                    // Fallback for messages with content but no parts
                    parts.push({ type: 'text', text: msg.content });
                  }

                  // Ensure we have at least one part
                  if (parts.length === 0) {
                    console.warn('Message has no parts, adding fallback:', msg);
                    parts.push({ type: 'text', text: 'Empty message' });
                  }

                  return {
                    role: (msg.role === 'assistant' ? 'assistant' : 'user') as
                      | 'assistant'
                      | 'user', // Ensure valid roles
                    content: parts.map((p: any) => ({
                      type: 'text' as const,
                      text: p.text || p.content || '',
                    })),
                  };
                } catch (error) {
                  console.error('Error processing message:', error, msg);
                  // Return a safe fallback
                  return {
                    role: 'user' as const,
                    content: [
                      {
                        type: 'text' as const,
                        text: 'Error processing message',
                      },
                    ],
                  };
                }
              });

              console.log(
                'Prepared Gemini fallback prompt:',
                JSON.stringify(prompt, null, 2),
              );

              const streamPromise = model.doStream({
                inputFormat: 'messages',
                mode: { type: 'regular' },
                prompt: prompt,
                temperature: config.generationConfig.temperature,
                maxTokens: config.generationConfig.maxOutputTokens,
                topK: config.generationConfig.topK,
                topP: config.generationConfig.topP,
              });

              console.log('Gemini fallback stream request sent');
              return await Promise.race([streamPromise, timeoutPromise]);
            } catch (geminiError: any) {
              console.error(
                'Gemini fallback also failed:',
                geminiError.message,
              );
              throw new Error(
                `All providers failed. Groq error: ${error.message}. Gemini error: ${geminiError.message}`,
              );
            }
          }
        }
      }

      // Check if any message has attachments (multimodal content)
      const hasAttachments = contents.some(
        (msg) =>
          msg.parts?.some(
            (part: any) => part.type === 'file' || part.type === 'image',
          ) ||
          msg.attachments?.length > 0 ||
          userMessage.attachments?.length > 0,
      );

      // If there are attachments, use Gemini directly since Groq doesn't support multimodal
      if (hasAttachments) {
        console.log(
          'Detected attachments, using Gemini for multimodal support',
        );
        const modelName = 'gemini-2.0-flash-exp';
        const model = geminiProvider.languageModel(modelName);

        // Add AI identity instructions to the prompt
        const enhancedContents = [
          {
            role: 'system' as const,
            parts: [{ type: 'text', text: aiIdentityInstructions }],
          },
          ...contents,
        ];

        // Prepare the prompt with attachments
        const prompt = enhancedContents.map((msg) => {
          const parts = msg.parts || [];
          return {
            role: (msg.role === 'assistant' ? 'assistant' : 'user') as
              | 'assistant'
              | 'user',
            content: parts.map((p: any) => {
              if (p.type === 'file' || p.type === 'image') {
                // Handle file/image parts
                return {
                  type: 'image' as const,
                  image: {
                    url: p.url,
                    mimeType: p.mediaType || 'image/jpeg',
                  },
                };
              } else {
                // Handle text parts
                return {
                  type: 'text' as const,
                  text: p.text || p.content || '',
                };
              }
            }),
          };
        });

        const streamPromise = model.doStream({
          inputFormat: 'messages',
          mode: { type: 'regular' },
          prompt: prompt,
          temperature: config.generationConfig.temperature,
          maxTokens: config.generationConfig.maxOutputTokens,
          topK: config.generationConfig.topK,
          topP: config.generationConfig.topP,
        });

        return streamPromise;
      }

      // Normal flow: Try Groq first, then fallback to Gemini
      while (attempts < maxAttempts) {
        try {
          // Use Groq as primary model
          console.log('🚀 Using Groq as primary provider...');

          // Add system message to contents for Groq
          const groqContents = [
            {
              role: 'system',
              parts: [{ type: 'text', text: aiIdentityInstructions }],
            },
            ...contents,
          ];
          const groqMessages = convertToGroqFormat(groqContents);

          const response = await callGroq(groqMessages, {
            temperature: config.generationConfig.temperature,
            maxTokens: config.generationConfig.maxOutputTokens,
            stream: true,
            topP: config.generationConfig.topP,
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
                              // Send content immediately without buffering
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
                } catch (streamError: any) {
                  console.error('Groq stream processing error:', streamError);
                  controller.error(streamError);
                } finally {
                  reader.releaseLock();
                }
              },
            }),
          };
        } catch (error: any) {
          attempts++;
          console.error(`Groq attempt ${attempts} failed:`, error.message);

          // If this is the last attempt, try Gemini fallback
          if (attempts >= maxAttempts) {
            console.log('Groq failed, trying Gemini fallback...');
            try {
              // Use Gemini Flash as fallback model
              const modelName = 'gemini-2.0-flash-exp';
              console.log('Using Gemini Flash model as fallback:', modelName);
              const model = geminiProvider.languageModel(modelName);

              // Add timeout to prevent hanging requests
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), 8000); // Reduced from 12s to 8s
              });

              // Add AI identity instructions to the prompt
              const enhancedContents = [
                {
                  role: 'system' as const,
                  parts: [{ type: 'text', text: aiIdentityInstructions }],
                },
                ...contents,
              ];

              // Validate and prepare the prompt
              const prompt = enhancedContents.map((msg) => {
                try {
                  // Ensure we have valid parts
                  const parts = msg.parts || [];
                  if (parts.length === 0 && msg.content) {
                    // Fallback for messages with content but no parts
                    parts.push({ type: 'text', text: msg.content });
                  }

                  // Ensure we have at least one part
                  if (parts.length === 0) {
                    console.warn('Message has no parts, adding fallback:', msg);
                    parts.push({ type: 'text', text: 'Empty message' });
                  }

                  return {
                    role: (msg.role === 'assistant' ? 'assistant' : 'user') as
                      | 'assistant'
                      | 'user', // Ensure valid roles
                    content: parts.map((p: any) => ({
                      type: 'text' as const,
                      text: p.text || p.content || '',
                    })),
                  };
                } catch (error) {
                  console.error('Error processing message:', error, msg);
                  // Return a safe fallback
                  return {
                    role: 'user' as const,
                    content: [
                      {
                        type: 'text' as const,
                        text: 'Error processing message',
                      },
                    ],
                  };
                }
              });

              console.log(
                'Prepared Gemini fallback prompt:',
                JSON.stringify(prompt, null, 2),
              );

              const streamPromise = model.doStream({
                inputFormat: 'messages',
                mode: { type: 'regular' },
                prompt: prompt,
                temperature: config.generationConfig.temperature,
                maxTokens: config.generationConfig.maxOutputTokens,
                topK: config.generationConfig.topK,
                topP: config.generationConfig.topP,
              });

              console.log('Gemini fallback stream request sent');
              return await Promise.race([streamPromise, timeoutPromise]);
            } catch (geminiError: any) {
              console.error(
                'Gemini fallback also failed:',
                geminiError.message,
              );
              throw new Error(
                `All providers failed. Groq error: ${error.message}. Gemini error: ${geminiError.message}`,
              );
            }
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
        // Chat not created - skipping assistant message save
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
            let hasReceivedContent = false;

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

                // Debug logging for empty responses
                if (!text && value) {
                  console.log(
                    'Empty text from stream value:',
                    JSON.stringify(value, null, 2),
                  );
                }

                if (text && !controllerClosed) {
                  hasReceivedContent = true;
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

                      // Only generate title if we don't have one already and user text is substantial
                      if (!titleGenerated && userText.length > 10) {
                        const generatedTitle =
                          await generateTitleFromUserMessage(userText, {
                            selectedModelId: selectedChatModel,
                            maxLength: 40,
                            style: 'concise',
                          });

                        // Only update if we got a good title
                        if (
                          generatedTitle &&
                          generatedTitle !== 'New Chat' &&
                          generatedTitle.length > 3
                        ) {
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
                        }
                      }
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

              // Check if we received any content from the AI
              if (!hasReceivedContent) {
                console.warn(
                  'No content received from AI stream, providing fallback',
                );
                const fallbackResponse =
                  "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or try again in a moment.";

                if (!controllerClosed) {
                  try {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: fallbackResponse })}\n\n`,
                      ),
                    );
                    fullResponse = fallbackResponse;
                  } catch (enqueueError) {
                    console.error(
                      'Failed to enqueue fallback response:',
                      enqueueError,
                    );
                    controllerClosed = true;
                  }
                }
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
              // Create a better fallback title from user message
              const userText =
                userMessage.content || userMessage.parts?.[0]?.text || '';
              let fallbackTitle = 'New Chat';

              if (userText.length > 0) {
                // Extract first few meaningful words as fallback
                const words = userText
                  .split(' ')
                  .filter((word: string) => word.length > 2)
                  .slice(0, 3);
                if (words.length > 0) {
                  fallbackTitle = words.join(' ');
                }
              }

              // Update for both logged-in users and guests
              await updateChatTitleById({
                chatId,
                title: fallbackTitle,
              });
            } catch (error) {
              console.error('Failed to update chat title:', error);
              // Continue even if title update fails
            }
          }

          // Validate response quality - be more lenient for short but valid responses
          const trimmedResponse = fullResponse.trim();
          if (trimmedResponse.length === 0) {
            console.warn(
              'Generated response is empty, providing fallback response',
            );
            // Instead of throwing an error, provide a helpful fallback response
            const fallbackResponse =
              "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or try again in a moment.";

            if (!controllerClosed) {
              try {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: fallbackResponse })}\n\n`,
                  ),
                );
                fullResponse = fallbackResponse;
              } catch (enqueueError) {
                console.error(
                  'Failed to enqueue fallback response:',
                  enqueueError,
                );
                controllerClosed = true;
              }
            }
          }

          // Only warn for very short responses but don't fail the request
          if (trimmedResponse.length > 0 && trimmedResponse.length < 10) {
            console.warn(
              'Generated response very short, but continuing:',
              trimmedResponse,
            );
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
