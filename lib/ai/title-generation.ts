export interface TitleGenerationOptions {
  maxLength?: number;
  includeQuestionMark?: boolean;
  style?: 'concise' | 'descriptive' | 'question';
  useModelName?: boolean;
  selectedModelId?: string;
  prioritizeContent?: boolean;
}

const DEFAULT_OPTIONS: TitleGenerationOptions = {
  maxLength: 35, // Slightly reduced for better display
  includeQuestionMark: false, // Usually not needed
  style: 'concise',
  useModelName: false,
  prioritizeContent: true,
};

// Enhanced lowercase words set
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
]);

function toTitleCase(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word, last word, or if it's not in the lowercase set
      if (index === 0 || !LOWERCASE_WORDS.has(word)) {
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

// Improved fallback title generation
function generateFallbackTitle(
  userMessage: string,
  maxLength: number = 35,
): string {
  if (!userMessage || userMessage.trim().length === 0) {
    return 'New Chat';
  }

  let message = userMessage.trim();

  // Remove common prefixes that make titles verbose
  const prefixesToRemove = [
    /^(please\s+)?(can you\s+)?(help me\s+)?(tell me\s+)?(explain\s+)?(show me\s+)?/i,
    /^(how\s+(do|can)\s+(i|you)\s+)/i,
    /^(what\s+(is|are)\s+)/i,
    /^(create\s+(a|an)\s+)/i,
  ];

  for (const prefix of prefixesToRemove) {
    message = message.replace(prefix, '');
  }

  // Take first meaningful words
  const words = message.split(' ').filter((word) => word.length > 0);
  let title = words.slice(0, 4).join(' ');

  // Clean up and format
  title = title.replace(/[.!?]+$/, '');
  title = toTitleCase(title);
  title = truncateTitle(title, maxLength);

  return title || 'New Chat';
}

export async function generateTitleFromUserMessage(
  userMessage: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!userMessage || userMessage.trim().length === 0) {
    return 'New Chat';
  }

  // Try AI generation first
  try {
    const aiTitle = await generateAITitle(userMessage, opts);
    if (aiTitle && aiTitle !== 'New Chat' && aiTitle.length >= 3) {
      console.log('AI title generation succeeded:', aiTitle);
      return aiTitle;
    }
  } catch (error) {
    console.error('AI title generation failed:', error);
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

  // Try to generate from AI response context if it's substantial
  if (aiResponse && aiResponse.length > 100) {
    try {
      const contextualTitle = await generateContextualTitle(
        userMessage,
        aiResponse,
        opts,
      );
      if (contextualTitle && contextualTitle !== 'New Chat') {
        return contextualTitle;
      }
    } catch (error) {
      console.error('Contextual title generation failed:', error);
    }
  }

  // Fall back to user message generation
  return generateTitleFromUserMessage(userMessage, options);
}

async function generateContextualTitle(
  userMessage: string,
  aiResponse: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const context = `User: ${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}
AI: ${aiResponse.substring(0, 300)}${aiResponse.length > 300 ? '...' : ''}`;

  const titlePrompt = `Based on this conversation, create a short, specific title (2-4 words max). Focus on the main topic or task. Avoid generic words like "help", "question", "discussion".

Examples of good titles:
- "Python Data Analysis"
- "React Component Debug"
- "SQL Query Optimization"
- "Marketing Strategy"

${context}

Title:`;

  return generateAITitleWithPrompt(titlePrompt, options);
}

async function generateAITitle(
  userMessage: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const cleanMessage = userMessage.trim().substring(0, 500); // Limit input length

  // Much more specific prompt for better results
  const titlePrompt = `Create a concise title (2-4 words) that captures the main topic or task. Be specific, not generic.

Bad examples: "Help with Code", "Question About", "Tell Me About"
Good examples: "React Authentication", "SQL Performance", "CSS Grid Layout", "Python Pandas"

User request: "${cleanMessage}"

Title:`;

  return generateAITitleWithPrompt(titlePrompt, options);
}

async function generateAITitleWithPrompt(
  prompt: string,
  options: TitleGenerationOptions,
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_SITE_URL || 'https://boltX.com',
          'X-Title': 'boltX',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9, // Higher temperature for faster title generation
          max_tokens: 20, // Very short for concise titles
          stream: false,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean up the generated title
    title = title.replace(/^["']|["']$/g, ''); // Remove quotes
    title = title.replace(/[.!;:,]+$/, ''); // Remove trailing punctuation
    title = title.replace(/^(title:|title\s*:?\s*)/i, ''); // Remove "title:" prefix

    // Apply title case
    title = toTitleCase(title);

    // Truncate if needed
    title = truncateTitle(title, opts.maxLength);

    // Validate the result
    if (
      !title ||
      title.length < 2 ||
      /^(title|chat|conversation|new)$/i.test(title)
    ) {
      throw new Error('Generated title is too generic or empty');
    }

    return title;
  } catch (error) {
    console.error('Error generating AI title:', error);
    throw error;
  }
}

// Utility function for UI integration - call this after title generation
export function updateThreadTitle(threadId: string, title: string): void {
  // Dispatch custom event for UI to listen to
  const event = new CustomEvent('threadTitleUpdated', {
    detail: { threadId, title },
  });
  window.dispatchEvent(event);
}

// Usage example for your app:
export async function handleNewThread(
  userMessage: string,
  threadId: string,
): Promise<string> {
  try {
    // Generate title
    const title = await generateTitleFromUserMessage(userMessage);

    // Update your thread storage/state here
    // updateThreadInDatabase(threadId, { title });

    // Notify UI components
    updateThreadTitle(threadId, title);

    return title;
  } catch (error) {
    console.error('Failed to handle new thread:', error);
    return 'New Chat';
  }
}
