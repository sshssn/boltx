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

// Groq API key for fallback
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (API_KEYS.length === 0 && !GROQ_API_KEY) {
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
  // API key rotated
};

// Groq fallback function with optimized settings
const callGroq = async (messages: any[], options: any = {}) => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  // Groq API call initiated

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Use Llama3-70b as default fallback
        messages: messages,
        temperature: options.temperature || 0.7, // Increased for better responses
        max_tokens: options.maxTokens || 1024, // Increased token limit
        stream: options.stream || false,
        top_p: 0.9, // Higher for better coding responses
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null, // No stop sequences
      }),
    },
  );

  // Groq API response received

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error response:', errorText);
    throw new Error(
      `Groq API error: ${response.status} ${response.statusText} - ${errorText}`,
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
        // Try Groq first as primary provider
        if (GROQ_API_KEY) {
          // Using Groq as primary provider
          try {
            const formattedPrompt = Array.isArray(params.prompt)
              ? params.prompt
              : typeof params.prompt === 'string'
                ? [{ role: 'user', content: params.prompt }]
                : params.prompt;

            const response = await callGroq(formattedPrompt, {
              temperature: params.temperature || 0.8,
              maxTokens: params.maxTokens || 1024,
            });

            const data = await response.json();

            // Log the full response for debugging
                    // Groq API response processed

            // Validate content
            const content = data.choices?.[0]?.message?.content;
            if (!content || content.trim() === '') {
              console.error('Groq returned empty content');
              throw new Error(
                'Groq API returned empty content - check prompt or model limits',
              );
            }

            return {
              content: [{ type: 'text', text: content }],
              finishReason: data.choices?.[0]?.finish_reason || 'stop',
              usage: {
                inputTokens: data.usage?.prompt_tokens || 0,
                outputTokens: data.usage?.completion_tokens || 0,
              },
              warnings: [],
            };
          } catch (groqError: any) {
            console.error('Groq primary failed');
            // Continue to Gemini fallback
          }
        }

        // Gemini as fallback
        let attempts = 0;
        const maxAttempts = Math.min(API_KEYS.length, 1);

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
              temperature: Math.min(Math.max(params.temperature || 0.8, 0), 1),
              maxTokens: Math.min(params.maxTokens || 1024, 4096),
              topK: params.topK || 20,
              topP: Math.min(Math.max(params.topP || 0.9, 0), 1),
            });

            return {
              content: result.text ? [{ type: 'text', text: result.text }] : [],
              finishReason: result.finishReason || 'stop',
              usage: {
                inputTokens: result.usage?.promptTokens || 0,
                outputTokens: result.usage?.completionTokens || 0,
              },
              warnings: ['Used Gemini fallback'],
            };
          } catch (error: any) {
            attempts++;
            console.error(
              `Gemini fallback attempt ${attempts} failed:`,
              error.message,
            );

            // Check if it's an API key issue and rotate
            if (error.status === 403 || error.status === 401) {
              if (attempts < maxAttempts) {
                rotateApiKey();
                continue;
              }
            }

            // Check for rate limiting - skip retry to prevent excessive calls
            if (error.status === 429) {
              // Gemini rate limited, skipping retry
              break;
            }
          }
        }

        throw new Error(
          'All providers failed - Groq primary and Gemini fallback both failed',
        );
      },

      doStream: async (params: any) => {
        // Try Groq first as primary provider for streaming
        if (GROQ_API_KEY) {
          // Using Groq as primary provider for streaming
          try {
            const formattedPrompt = Array.isArray(params.prompt)
              ? params.prompt
              : typeof params.prompt === 'string'
                ? [{ role: 'user', content: params.prompt }]
                : params.prompt;

            const response = await callGroq(formattedPrompt, {
              temperature: params.temperature || 0.8,
              maxTokens: params.maxTokens || 1024,
              stream: true,
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
                          } catch (parseError: any) {
                            console.log(
                              'Parse error for line:',
                              line,
                              parseError.message,
                            );
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
                  } catch (streamError: any) {
                    console.error('Groq stream processing error:', streamError);
                    controller.error(streamError);
                  } finally {
                    reader.releaseLock();
                  }
                },
              }),
            };
          } catch (groqError: any) {
            console.error('Groq primary streaming failed');
            // Continue to Gemini fallback
          }
        }

        // Gemini as fallback for streaming
        let attempts = 0;
        const maxAttempts = Math.min(API_KEYS.length, 1);

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
              temperature: Math.min(Math.max(params.temperature || 0.8, 0), 1),
              maxTokens: Math.min(params.maxTokens || 1024, 4096),
              topK: params.topK || 20,
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
                          controller.enqueue({
                            type: 'text-delta',
                            delta: value.textDelta,
                          });
                        } else if (value.text) {
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
                    console.error(
                      'Gemini stream processing error:',
                      streamError,
                    );
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
            console.error(
              `Gemini fallback streaming attempt ${attempts} failed:`,
              error.message,
            );

            if (error.status === 403 || error.status === 401) {
              if (attempts < maxAttempts) {
                rotateApiKey();
                continue;
              }
            }

            if (error.status === 429) {
              // Gemini rate limited, skipping retry
              break;
            }
          }
        }

        throw new Error(
          'All streaming providers failed - Groq primary and Gemini fallback both failed',
        );
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
  hasGroqFallback: !!GROQ_API_KEY,
});

export const resetApiKeyRotation = () => {
  currentKeyIndex = 0;
  provider = createProviderWithFallback();
};
