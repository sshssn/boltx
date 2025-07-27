import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Multiple API keys for fallback
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

// Create the provider with the first available API key
const provider = createGoogleGenerativeAI({
  apiKey: API_KEYS[0] || '',
});

// Export the v1 provider for chat routes
export const geminiProvider = provider;

// Create a simple v2-compatible wrapper for streamObject
export const myProvider = {
  languageModel(modelName: string) {
    // For streamObject compatibility, we'll use a simple object
    // that matches the expected interface
    return {
      modelId: modelName,
      specificationVersion: 'v2' as const,
      supportedUrls: { '*': [/.*/] }, // Support all URLs
      provider: 'google',
      doGenerate: async (params: any) => {
        const v1Model = provider.languageModel(modelName);
        const result = await v1Model.doGenerate({
          inputFormat: 'prompt',
          mode: { type: 'regular' },
          prompt: params.prompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
        });

        return {
          content: result.text ? [{ type: 'text', text: result.text }] : [],
          finishReason: 'stop',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
          },
          warnings: [],
        };
      },
      doStream: async (params: any) => {
        const v1Model = provider.languageModel(modelName);
        const result = await v1Model.doStream({
          inputFormat: 'prompt',
          mode: { type: 'regular' },
          prompt: params.prompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
        });

        return {
          stream: new ReadableStream({
            async start(controller) {
              const reader = result.stream.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  if (value.type === 'text-delta') {
                    controller.enqueue({
                      type: 'text-delta',
                      delta: value.textDelta,
                    });
                  }
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          }),
        };
      },
    } as any; // Add type assertion to bypass strict type checking
  },
  imageModel(modelName: string) {
    // For image generation compatibility
    return {
      modelId: modelName,
      specificationVersion: 'v2' as const,
      supportedUrls: { '*': [/.*/] },
      provider: 'google',
      doGenerate: async (params: any) => {
        const v1Model = provider.languageModel(modelName);
        const result = await v1Model.doGenerate({
          inputFormat: 'prompt',
          mode: { type: 'regular' },
          prompt: params.prompt,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
        });

        return {
          content: result.text ? [{ type: 'text', text: result.text }] : [],
          finishReason: 'stop',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
          },
          warnings: [],
        };
      },
    } as any;
  },
};
