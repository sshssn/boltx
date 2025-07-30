// Groq API provider for Llama3-70b model
// Groq is known for extremely fast inference

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY not found in environment variables');
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export const callGroq = async (
  messages: GroqMessage[],
  options: GroqOptions = {},
) => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
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
          model: 'llama3-70b-8192',
          messages: messages,
          temperature: options.temperature || 0.8, // Increased for more creative and varied responses
          max_tokens: options.maxTokens || 1024, // Increased token limit
          stream: options.stream || false,
          top_p: options.topP || 0.9,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    // Groq API response received

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // Groq API call successful
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Groq API timeout - request took too long');
    }
    throw error;
  }
};

// Convert AI SDK format to Groq format
export const convertToGroqFormat = (messages: any[]): GroqMessage[] => {
  return messages
    .map((msg) => {
      let content = '';

      // Handle different message formats
      if (msg.parts && Array.isArray(msg.parts)) {
        // Format: { role: 'user', parts: [{ type: 'text', text: '...' }] }
        content = msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('')
          .trim();
      } else if (msg.content && typeof msg.content === 'string') {
        // Format: { role: 'user', content: '...' }
        content = msg.content.trim();
      } else if (msg.content && Array.isArray(msg.content)) {
        // Format: { role: 'user', content: [{ type: 'text', text: '...' }] }
        content = msg.content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('')
          .trim();
      } else if (msg.text) {
        // Format: { role: 'user', text: '...' }
        content = msg.text.trim();
      }

      // Skip empty messages
      if (!content || content.trim() === '') {
        console.warn('Skipping empty message:', msg);
        return null;
      }

      return {
        role: msg.role,
        content: content,
      };
    })
    .filter(Boolean) as GroqMessage[]; // Remove null entries
};

// Groq provider for AI SDK compatibility
export const groqProvider = {
  languageModel(modelName: string) {
    return {
      async generateContent(request: any) {
        const messages = convertToGroqFormat(request.messages);

        const response = await callGroq(messages, {
          temperature: request.generationConfig?.temperature,
          maxTokens: request.generationConfig?.maxOutputTokens,
          stream: false,
          topP: request.generationConfig?.topP,
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
          usage: data.usage,
        };
      },

      async streamText(request: any) {
        const messages = convertToGroqFormat(request.messages);

        const response = await callGroq(messages, {
          temperature: request.generationConfig?.temperature,
          maxTokens: request.generationConfig?.maxOutputTokens,
          stream: true,
          topP: request.generationConfig?.topP,
        });

        if (!response.body) {
          throw new Error('No response body from Groq');
        }

        return new ReadableStream({
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
                      // Check if we received any content
                      if (!hasContent) {
                        console.error('Groq stream completed without content');
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

              // If we reach here without content, it's an error
              if (!hasContent) {
                console.error('Groq stream completed without any content');
                controller.error(new Error('Groq stream returned no content'));
              }
            } catch (streamError: any) {
              console.error('Groq stream processing error:', streamError);
              controller.error(streamError);
            } finally {
              reader.releaseLock();
            }
          },
        });
      },
    };
  },
};
