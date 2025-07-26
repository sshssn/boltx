import { GoogleGenAI } from '@google/genai';

// Multiple API keys for fallback
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;
const rateLimitMap = new Map<string, number>();

export class GeminiProvider {
  private ai: GoogleGenAI;
  private currentKey: string;

  constructor() {
    this.currentKey = API_KEYS[currentKeyIndex] || '';
    this.ai = new GoogleGenAI({ apiKey: this.currentKey });
  }

  private switchToNextKey() {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    this.currentKey = API_KEYS[currentKeyIndex] || '';
    this.ai = new GoogleGenAI({ apiKey: this.currentKey });
    console.log(`Switched to API key ${currentKeyIndex + 1}`);
  }

  private isRateLimited(key: string): boolean {
    const lastRateLimit = rateLimitMap.get(key);
    if (!lastRateLimit) return false;

    // Check if 40 seconds have passed since last rate limit
    return Date.now() - lastRateLimit < 40000;
  }

  async generateContentStream(model: string, config: any, contents: any[]) {
    const maxRetries = API_KEYS.length;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentKey = API_KEYS[currentKeyIndex];

      if (!currentKey) {
        throw new Error('No valid API keys available');
      }

      if (this.isRateLimited(currentKey)) {
        this.switchToNextKey();
        continue;
      }

      try {
        return await this.ai.models.generateContentStream({
          model,
          config,
          contents,
        });
      } catch (error: any) {
        if (error.status === 429) {
          // Rate limited - mark this key and try the next one
          rateLimitMap.set(currentKey, Date.now());
          this.switchToNextKey();
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    // All keys are rate limited
    throw new Error(
      'All API keys are currently rate limited. Please try again later.',
    );
  }

  getCurrentKeyIndex() {
    return currentKeyIndex;
  }

  getAvailableKeys() {
    return API_KEYS.length;
  }

  languageModel(modelName: string) {
    // Return a model configuration for the AI SDK
    return {
      model: modelName,
      provider: this,
    };
  }
}

// Export a singleton instance
export const geminiProvider = new GeminiProvider();

// Export as myProvider for backward compatibility
export const myProvider = geminiProvider;
