import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Multiple API keys for fallback with proper validation
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(
  (key): key is string =>
    key !== undefined && key !== null && key.trim() !== '',
);

// OpenRouter API key for fallback
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (API_KEYS.length === 0 && !OPENROUTER_API_KEY) {
  throw new Error('No valid API keys found in environment variables');
}

// Create provider with error handling and fallback logic
let currentKeyIndex = 0;

const createProviderWithFallback = () => {
  const apiKey = API_KEYS[currentKeyIndex];
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No available API keys');
  }

  return createGoogleGenerativeAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta', // Explicit base URL
  });
};

// Initialize provider
let provider = createProviderWithFallback();

// Function to rotate to next API key on failure
const rotateApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  provider = createProviderWithFallback();
  console.log(`Rotated to API key index: ${currentKeyIndex}`);
};

// OpenRouter fallback function
const callOpenRouter = async (messages: any[], options: any = {}) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://boltX.com',
        'X-Title': 'boltX',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e2b-it:free',
        messages: messages,
        temperature: options.temperature || 0.9,
        max_tokens: options.maxTokens || 800,
        stream: options.stream || false,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
    );
  }

  return response;
};

// Export the provider for chat routes
export const geminiProvider = provider;

// Enhanced v2-compatible wrapper with better error handling and OpenRouter fallback
export const myProvider = {
  languageModel(modelName: string) {
    // Validate model name
    const validModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash', // Your custom model
    ];

    if (!validModels.some((model) => modelName.includes(model.split('-')[0]))) {
      console.warn(`Potentially unsupported model: ${modelName}`);
    }

    return {
      modelId: modelName,
      specificationVersion: 'v2' as const,
      supportedUrls: { '*': [/.*/] },
      provider: 'google',

      doGenerate: async (params: any) => {
        let attempts = 0;
        const maxAttempts = API_KEYS.length;

        while (attempts < maxAttempts) {
          try {
            const v1Model = provider.languageModel(modelName);

            // Enhanced parameter validation and formatting
            const formattedPrompt = Array.isArray(params.prompt)
              ? params.prompt
              : typeof params.prompt === 'string'
                ? [{ role: 'user', content: params.prompt }]
                : params.prompt;

            const result = await v1Model.doGenerate({
              inputFormat: 'messages',
              mode: { type: 'regular' },
              prompt: formattedPrompt,
              temperature: Math.min(Math.max(params.temperature || 0.9, 0), 2), // Clamp between 0-2
              maxTokens: Math.min(params.maxTokens || 800, 8192), // Reasonable limits
              topK: params.topK || 40,
              topP: Math.min(Math.max(params.topP || 0.9, 0), 1), // Clamp between 0-1
            });

            return {
              content: result.text ? [{ type: 'text', text: result.text }] : [],
              finishReason: result.finishReason || 'stop',
              usage: {
                inputTokens: result.usage?.promptTokens || 0,
                outputTokens: result.usage?.completionTokens || 0,
              },
              warnings: [],
            };
          } catch (error: any) {
            attempts++;
            console.error(`API attempt ${attempts} failed:`, error.message);

            // Check if it's an API key issue and rotate
            if (error.status === 403 || error.status === 401) {
              if (attempts < maxAttempts) {
                rotateApiKey();
                continue;
              }
            }

            // Check for rate limiting
            if (error.status === 429) {
              const retryAfter = error.headers?.['retry-after'] || 1;
              console.log(
                `Rate limited, waiting ${retryAfter}s before retry...`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, retryAfter * 1000),
              );
              continue;
            }

            // If this is the last attempt, try OpenRouter fallback
            if (attempts >= maxAttempts) {
              console.log(
                'All Gemini attempts failed, trying OpenRouter fallback...',
              );
              try {
                const formattedPrompt = Array.isArray(params.prompt)
                  ? params.prompt
                  : typeof params.prompt === 'string'
                    ? [{ role: 'user', content: params.prompt }]
                    : params.prompt;

                const response = await callOpenRouter(formattedPrompt, {
                  temperature: params.temperature || 0.9,
                  maxTokens: params.maxTokens || 800,
                });

                const data = await response.json();

                return {
                  content: data.choices?.[0]?.message?.content
                    ? [{ type: 'text', text: data.choices[0].message.content }]
                    : [],
                  finishReason: data.choices?.[0]?.finish_reason || 'stop',
                  usage: {
                    inputTokens: data.usage?.prompt_tokens || 0,
                    outputTokens: data.usage?.completion_tokens || 0,
                  },
                  warnings: ['Used OpenRouter fallback'],
                };
              } catch (openRouterError: any) {
                console.error(
                  'OpenRouter fallback also failed:',
                  openRouterError.message,
                );
                throw new Error(
                  `All providers failed. Last Gemini error: ${error.message}. OpenRouter error: ${openRouterError.message}`,
                );
              }
            }
          }
        }

        // Try OpenRouter as final fallback
        if (OPENROUTER_API_KEY) {
          console.log('Falling back to OpenRouter API');
          try {
            const response = await callOpenRouter(
              Array.isArray(params.prompt)
                ? params.prompt
                : [{ role: 'user', content: params.prompt }],
              {
                temperature: params.temperature || 0.9,
                maxTokens: params.maxTokens || 800,
                stream: false,
              },
            );

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';

            return {
              content: [{ type: 'text', text }],
              finishReason: 'stop',
              usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              warnings: [],
            };
          } catch (openRouterError) {
            console.error('OpenRouter fallback failed:', openRouterError);
          }
        }

        throw new Error('Unexpected error: All attempts exhausted');
      },

      doStream: async (params: any) => {
        let attempts = 0;
        const maxAttempts = API_KEYS.length;

        while (attempts < maxAttempts) {
          try {
            const v1Model = provider.languageModel(modelName);

            // Enhanced parameter validation and formatting
            const formattedPrompt = Array.isArray(params.prompt)
              ? params.prompt
              : typeof params.prompt === 'string'
                ? [{ role: 'user', content: params.prompt }]
                : params.prompt;

            const result = await v1Model.doStream({
              inputFormat: 'messages',
              mode: { type: 'regular' },
              prompt: formattedPrompt,
              temperature: Math.min(Math.max(params.temperature || 0.9, 0), 2),
              maxTokens: Math.min(params.maxTokens || 800, 8192),
              topK: params.topK || 40,
              topP: Math.min(Math.max(params.topP || 0.9, 0), 1),
            });

            return {
              stream: new ReadableStream({
                async start(controller) {
                  let reader: ReadableStreamDefaultReader<any> | null = null;

                  try {
                    reader = result.stream.getReader();

                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;

                      // Handle different response formats
                      if (value && typeof value === 'object') {
                        if (value.type === 'text-delta' && value.textDelta) {
                          // No delay for instant streaming
                          controller.enqueue({
                            type: 'text-delta',
                            delta: value.textDelta,
                          });
                        } else if (value.text) {
                          // Handle non-delta text responses
                          controller.enqueue({
                            type: 'text-delta',
                            delta:
                              typeof value.text === 'function'
                                ? value.text()
                                : value.text,
                          });
                        }
                      }
                    }

                    controller.close();
                  } catch (streamError: any) {
                    console.error('Stream processing error:', streamError);
                    controller.error(streamError);
                  } finally {
                    if (reader) {
                      try {
                        reader.releaseLock();
                      } catch (releaseError) {
                        console.warn(
                          'Failed to release stream reader:',
                          releaseError,
                        );
                      }
                    }
                  }
                },
              }),
            };
          } catch (error: any) {
            attempts++;
            console.error(`Stream attempt ${attempts} failed:`, error.message);

            // Same error handling logic as doGenerate
            if (error.status === 403 || error.status === 401) {
              if (attempts < maxAttempts) {
                rotateApiKey();
                continue;
              }
            }

            if (error.status === 429) {
              const retryAfter = error.headers?.['retry-after'] || 1;
              await new Promise((resolve) =>
                setTimeout(resolve, retryAfter * 1000),
              );
              continue;
            }

            // If this is the last attempt, try OpenRouter fallback
            if (attempts >= maxAttempts) {
              console.log(
                'All Gemini streaming attempts failed, trying OpenRouter fallback...',
              );
              try {
                const formattedPrompt = Array.isArray(params.prompt)
                  ? params.prompt
                  : typeof params.prompt === 'string'
                    ? [{ role: 'user', content: params.prompt }]
                    : params.prompt;

                const response = await callOpenRouter(formattedPrompt, {
                  temperature: params.temperature || 0.9,
                  maxTokens: params.maxTokens || 800,
                  stream: true,
                });

                if (!response.body) {
                  throw new Error('No response body from OpenRouter');
                }

                return {
                  stream: new ReadableStream({
                    async start(controller) {
                      const reader = response.body?.getReader();
                      if (!reader) {
                        throw new Error(
                          'No response body reader from OpenRouter',
                        );
                      }
                      const decoder = new TextDecoder();

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
                                controller.close();
                                return;
                              }

                              try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices?.[0]?.delta?.content) {
                                  controller.enqueue({
                                    type: 'text-delta',
                                    delta: parsed.choices[0].delta.content,
                                  });
                                }
                              } catch (parseError) {
                                // Ignore parse errors for incomplete chunks
                              }
                            }
                          }
                        }
                      } catch (streamError: any) {
                        console.error(
                          'OpenRouter stream processing error:',
                          streamError,
                        );
                        controller.error(streamError);
                      } finally {
                        reader.releaseLock();
                      }
                    },
                  }),
                };
              } catch (openRouterError: any) {
                console.error(
                  'OpenRouter streaming fallback also failed:',
                  openRouterError.message,
                );
                throw new Error(
                  `All providers failed for streaming. Last Gemini error: ${error.message}. OpenRouter error: ${openRouterError.message}`,
                );
              }
            }
          }
        }

        throw new Error('Unexpected streaming error: All attempts exhausted');
      },
    };
  },

  imageModel(modelName: string) {
    return {
      modelId: modelName,
      specificationVersion: 'v2' as const,
      supportedUrls: { '*': [/.*/] },
      provider: 'google',

      doGenerate: async (params: any) => {
        // Note: Gemini doesn't support image generation, only image understanding
        // This is a placeholder for compatibility
        throw new Error(
          'Image generation not supported by Gemini models. Use image understanding instead.',
        );
      },
    };
  },
};

// Export utility functions for monitoring
export const getApiKeyStatus = () => ({
  totalKeys: API_KEYS.length,
  currentKeyIndex,
  hasValidKeys: API_KEYS.length > 0,
  hasOpenRouterFallback: !!OPENROUTER_API_KEY,
});

export const resetApiKeyRotation = () => {
  currentKeyIndex = 0;
  provider = createProviderWithFallback();
};
