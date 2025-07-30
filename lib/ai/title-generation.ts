export interface TitleGenerationOptions {
  maxLength?: number;
  includeQuestionMark?: boolean;
  style?: 'concise' | 'descriptive' | 'question';
  useModelName?: boolean;
  selectedModelId?: string;
  prioritizeContent?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface AIProvider {
  name: 'gemini' | 'openrouter';
  apiKey: string;
  endpoint: string;
  model: string;
}

const DEFAULT_OPTIONS: TitleGenerationOptions = {
  maxLength: 35,
  includeQuestionMark: false,
  style: 'concise',
  useModelName: false,
  prioritizeContent: true,
  timeout: 5000, // Increased timeout for better reliability
  retryAttempts: 0, // No retries to avoid rate limit spam
};

// Rate limit tracking
class RateLimitManager {
  private rateLimits = new Map<
    string,
    { resetTime: number; remaining: number }
  >();

  isRateLimited(provider: string): boolean {
    const limit = this.rateLimits.get(provider);
    if (!limit) return false;

    if (Date.now() > limit.resetTime) {
      this.rateLimits.delete(provider);
      return false;
    }

    return limit.remaining <= 0;
  }

  recordRateLimit(provider: string, resetAfterSeconds = 60): void {
    this.rateLimits.set(provider, {
      resetTime: Date.now() + resetAfterSeconds * 1000,
      remaining: 0,
    });
  }

  recordSuccess(provider: string): void {
    this.rateLimits.delete(provider);
  }
}

// Create global instance
const rateLimitManager = new RateLimitManager();

// Enhanced lowercase words set for proper title casing
const LOWERCASE_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'if',
  'in',
  'is',
  'it',
  'nor',
  'on',
  'or',
  'so',
  'the',
  'to',
  'up',
  'yet',
  'with',
  'from',
  'into',
  'onto',
  'upon',
  'over',
  'under',
  'above',
  'below',
  'across',
  'through',
  'during',
  'before',
  'after',
  'until',
  'while',
  'within',
  'of',
  'about',
  'vs',
  'via',
  'per',
  'than',
  'then',
  'between',
  'among',
  'behind',
  'beside',
  'beyond',
  'inside',
  'outside',
  'toward',
  'towards',
  'underneath',
  'against',
]);

function toTitleCase(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index, array) => {
      // Always capitalize first word, last word, or if it's not in the lowercase set
      if (
        index === 0 ||
        index === array.length - 1 ||
        !LOWERCASE_WORDS.has(word)
      ) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

function truncateTitle(title: string, maxLength?: number): string {
  if (!maxLength || title.length <= maxLength) {
    return title;
  }

  // Find the last complete word within the limit
  const truncated = title.substring(0, maxLength - 1);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.6) {
    return truncated.substring(0, lastSpaceIndex);
  }

  return `${truncated}…`;
}

function cleanGeneratedTitle(title: string): string {
  if (!title) return '';

  // Create a copy to avoid reassigning parameters
  let cleanedTitle = title
    .replace(/^["']+|["']+$/g, '') // Remove quotes
    .replace(/^Title:\s*/i, '') // Remove "Title:" prefix
    .replace(/^[-\s]+|[-\s]+$/g, '') // Remove leading/trailing dashes and spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Ensure it's not too short
  if (cleanedTitle.length < 2) {
    cleanedTitle = 'New Chat';
  }

  return cleanedTitle;
}

function validateTitle(title: string): boolean {
  if (!title || title.length < 2) return false;

  // Check for generic/useless titles
  const genericTitles = [
    'title',
    'chat',
    'conversation',
    'new',
    'untitled',
    'help',
    'question',
    'discussion',
    'topic',
    'request',
    'task',
    'problem',
    'issue',
  ];

  const lowerTitle = title.toLowerCase();
  return !genericTitles.some(
    (generic) => lowerTitle === generic || lowerTitle.startsWith(`${generic} `),
  );
}

// Improved fallback title generation with better keyword extraction
function generateFallbackTitle(userMessage: string, maxLength = 35): string {
  if (!userMessage || userMessage.trim().length === 0) {
    return 'New Chat';
  }

  // Extract meaningful words from user message
  const words = userMessage
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !LOWERCASE_WORDS.has(word))
    .slice(0, 3);

  if (words.length === 0) {
    return 'New Chat';
  }

  // Create a simple title from the first few meaningful words
  const title = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return truncateTitle(title, maxLength);
}

// Gemini API integration
async function generateTitleWithGemini(
  prompt: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found');
  }

  // Check rate limit
  if (rateLimitManager.isRateLimited('gemini')) {
    throw new Error('Gemini API rate limited - skipping');
  }

  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  timeoutId = setTimeout(() => controller.abort(), options.timeout || 2500);

  try {
    console.log(
      'Attempting Gemini API call with key:',
      GEMINI_API_KEY ? 'SET' : 'NOT SET',
    );

    // Add AI identity instructions to the title generation prompt
    const enhancedPrompt = `You are boltX, an AI assistant trained by AffinityX. Generate a short, descriptive title (max 5 words) for this conversation: ${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancedPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Lower for more consistent titles
            maxOutputTokens: 20, // Increased slightly for better titles
            topP: 0.8,
            topK: 10,
          },
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    console.log('Gemini API response status:', response.status);

    if (response.status === 429) {
      rateLimitManager.recordRateLimit('gemini', 5); // Reduced to 5 seconds for faster recovery
      throw new Error('Gemini API rate limited');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    console.log('Extracted title from Gemini:', title);

    rateLimitManager.recordSuccess('gemini');
    return cleanGeneratedTitle(title);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini API timeout - request took too long');
    }
    throw error;
  }
}

// OpenRouter API integration (fallback 1 - DeepSeek)
async function generateTitleWithOpenRouter(
  prompt: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not found');
  }

  // Check rate limit
  if (rateLimitManager.isRateLimited('openrouter')) {
    throw new Error('OpenRouter API rate limited - skipping');
  }

  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  timeoutId = setTimeout(() => controller.abort(), options.timeout || 800); // Super fast timeout for speed

  try {
    console.log(
      'Attempting Groq API call with key:',
      GROQ_API_KEY ? 'SET' : 'NOT SET',
    );

    // Add AI identity instructions to the title generation prompt
    const enhancedPrompt = `You are boltX, an AI assistant trained by AffinityX. Generate a short, descriptive title (max 5 words) for this conversation: ${prompt}`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192', // Use Llama3-70b for speed
          messages: [{ role: 'user', content: enhancedPrompt }],
          temperature: 0.1, // Very low for speed
          max_tokens: 10, // Very short for speed
          stream: false,
          top_p: 0.5, // Lower for speed
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    console.log('Groq API response status:', response.status);

    if (response.status === 429) {
      rateLimitManager.recordRateLimit('groq', 5);
      throw new Error('Groq API rate limited');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || '';

    rateLimitManager.recordSuccess('groq');
    return cleanGeneratedTitle(title);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Groq API timeout - request took too long');
    }
    throw error;
  }
}

// Groq API integration (fallback 2)
async function generateTitleWithGroqFallback(
  prompt: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const GROQ_API_KEY_2 = process.env.GROQ_API_KEY_2;

  if (!GROQ_API_KEY_2) {
    throw new Error('Groq API key 2 not found');
  }

  // Check rate limit
  if (rateLimitManager.isRateLimited('openrouter-fallback')) {
    throw new Error('OpenRouter Fallback API rate limited - skipping');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || 2500,
  );

  try {
    console.log(
      'Attempting Groq Fallback API call with key:',
      GROQ_API_KEY_2 ? 'SET' : 'NOT SET',
    );

    // Add AI identity instructions to the title generation prompt
    const enhancedPrompt = `You are boltX, an AI assistant trained by AffinityX. Generate a short, descriptive title (max 5 words) for this conversation: ${prompt}`;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY_2}`,
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'ThreadTitleGenerator',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-coder:free', // Qwen model for fallback
          messages: [{ role: 'user', content: enhancedPrompt }],
          temperature: 0.3,
          max_tokens: 20,
          stream: false,
          top_p: 0.8,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);
    console.log('OpenRouter Fallback API response status:', response.status);

    if (response.status === 429) {
      rateLimitManager.recordRateLimit('openrouter-fallback', 5);
      throw new Error('OpenRouter Fallback API rate limited');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Fallback API error response:', errorText);
      throw new Error(
        `Groq Fallback API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || '';

    rateLimitManager.recordSuccess('groq-fallback');
    return cleanGeneratedTitle(title);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Groq Fallback API timeout - request took too long');
    }
    throw error;
  }
}

// Main AI title generation with provider fallback
async function generateAITitle(
  userMessage: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const cleanMessage = userMessage.trim().substring(0, 400);

  // Optimized prompt for concise, specific titles
  const titlePrompt = `Generate a concise 2-4 word title for this request. Focus on the main topic, technology, or task. Use proper English and be specific.

Examples:
- "React Authentication Setup" for React auth questions
- "Python Data Analysis" for pandas/data questions  
- "CSS Grid Layout" for CSS layout help
- "API Error Debugging" for API troubleshooting
- "Database Query Optimization" for SQL performance

User request: "${cleanMessage}"

Title (2-4 words only):`;

  const providers = [
    () => generateTitleWithGemini(titlePrompt, options),
    () => generateTitleWithOpenRouter(titlePrompt, options),
    () => generateTitleWithGroqFallback(titlePrompt, options),
  ];

  // Try each provider (no retries to avoid rate limit spam)
  for (const generateTitle of providers) {
    try {
      const title = await generateTitle();

      if (title && validateTitle(title)) {
        const formattedTitle = toTitleCase(title);
        const truncatedTitle = truncateTitle(formattedTitle, options.maxLength);

        console.log(`AI title generation succeeded: "${truncatedTitle}"`);
        return truncatedTitle;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Title generation failed:`, errorMessage);

      // Skip to next provider immediately on rate limit
      if (errorMessage.includes('rate limited')) {
        continue;
      }
    }
  }

  throw new Error('All AI title generation providers failed');
}

// Enhanced contextual title generation
async function generateContextualTitle(
  userMessage: string,
  aiResponse: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const context = `User: ${userMessage.substring(0, 150)}${userMessage.length > 150 ? '...' : ''}
Assistant: ${aiResponse.substring(0, 250)}${aiResponse.length > 250 ? '...' : ''}`;

  const contextualPrompt = `Based on this conversation, create a specific 2-4 word title that captures the main topic or task. Focus on technical terms, frameworks, or specific subjects mentioned.

Good examples:
- "React Component Debug"
- "SQL Performance Issue" 
- "Python Algorithm Help"
- "API Integration Guide"

${context}

Title (2-4 words):`;

  return generateAITitle(contextualPrompt, options);
}

// Public API functions
export async function generateTitleFromUserMessage(
  userMessage: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!userMessage || userMessage.trim().length === 0) {
    return 'New Chat';
  }

  try {
    const aiTitle = await generateAITitle(userMessage, opts);
    if (aiTitle && validateTitle(aiTitle)) {
      return aiTitle;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('AI title generation failed, using fallback:', errorMessage);
  }

  // Use improved fallback
  const fallbackTitle = generateFallbackTitle(userMessage, opts.maxLength);
  console.log('Using fallback title:', fallbackTitle);
  return fallbackTitle;
}

export async function generateTitleFromAIResponse(
  userMessage: string,
  aiResponse: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Try contextual generation first if response is substantial
  if (aiResponse && aiResponse.length > 100) {
    try {
      const contextualTitle = await generateContextualTitle(
        userMessage,
        aiResponse,
        opts,
      );
      if (contextualTitle && validateTitle(contextualTitle)) {
        return contextualTitle;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Contextual title generation failed:', errorMessage);
    }
  }

  // Fall back to user message generation
  return generateTitleFromUserMessage(userMessage, options);
}

// Real-time thread title update with debouncing
export class ThreadTitleManager {
  private titleCache = new Map<string, string>();
  private processingQueue = new Map<string, Promise<string>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  async updateThreadTitle(
    threadId: string,
    userMessage: string,
    aiResponse?: string,
    options: TitleGenerationOptions = {},
  ): Promise<string> {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(threadId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Check if already processing
    const existingPromise = this.processingQueue.get(threadId);
    if (existingPromise) {
      return existingPromise;
    }

    // Debounce rapid updates
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          this.debounceTimers.delete(threadId);

          const titlePromise = aiResponse
            ? generateTitleFromAIResponse(userMessage, aiResponse, options)
            : generateTitleFromUserMessage(userMessage, options);

          this.processingQueue.set(threadId, titlePromise);

          const title = await titlePromise;

          this.titleCache.set(threadId, title);
          this.processingQueue.delete(threadId);

          // Dispatch update event
          this.notifyTitleUpdate(threadId, title);

          resolve(title);
        } catch (error) {
          this.processingQueue.delete(threadId);
          console.error(
            `Failed to update title for thread ${threadId}:`,
            error,
          );
          resolve('New Chat');
        }
      }, 200); // 200ms debounce - balanced speed vs efficiency

      this.debounceTimers.set(threadId, timer);
    });
  }

  private notifyTitleUpdate(threadId: string, title: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('threadTitleUpdated', {
        detail: { threadId, title },
      });
      window.dispatchEvent(event);
    }
  }

  getCachedTitle(threadId: string): string | undefined {
    return this.titleCache.get(threadId);
  }

  clearCache(threadId?: string): void {
    if (threadId) {
      this.titleCache.delete(threadId);
      this.processingQueue.delete(threadId);
      const timer = this.debounceTimers.get(threadId);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(threadId);
      }
    } else {
      this.titleCache.clear();
      this.processingQueue.clear();
      this.debounceTimers.forEach((timer) => clearTimeout(timer));
      this.debounceTimers.clear();
    }
  }
}

// Global instance for easy use
export const titleManager = new ThreadTitleManager();

// Utility functions for backward compatibility
export function updateThreadTitle(threadId: string, title: string): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('threadTitleUpdated', {
      detail: { threadId, title },
    });
    window.dispatchEvent(event);
  }
}

export async function handleNewThread(
  userMessage: string,
  threadId: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  return titleManager.updateThreadTitle(
    threadId,
    userMessage,
    undefined,
    options,
  );
}
