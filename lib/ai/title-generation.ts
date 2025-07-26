import { chatModels } from './models';

export interface TitleGenerationOptions {
  maxLength?: number;
  includeQuestionMark?: boolean;
  style?: 'concise' | 'descriptive' | 'question';
  useModelName?: boolean;
  selectedModelId?: string;
}

const DEFAULT_OPTIONS: TitleGenerationOptions = {
  maxLength: 40, // Reduced from 60 to 40 for shorter titles
  includeQuestionMark: true,
  style: 'concise',
  useModelName: true,
};

export async function generateTitleFromUserMessage(
  userMessage: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // If useModelName is true and we have a selectedModelId, use the model short name
  if (opts.useModelName && opts.selectedModelId) {
    const selectedModel = chatModels.find(
      (model) => model.id === opts.selectedModelId,
    );
    if (selectedModel) {
      return selectedModel.shortName;
    }
  }

  // Fallback to a simple title based on the message
  return generateFallbackTitle(userMessage, opts);
}

export async function generateTitleFromAIResponse(
  userMessage: string,
  aiResponse: string,
  options: TitleGenerationOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // If useModelName is true and we have a selectedModelId, use the model short name
  if (opts.useModelName && opts.selectedModelId) {
    const selectedModel = chatModels.find(
      (model) => model.id === opts.selectedModelId,
    );
    if (selectedModel) {
      return selectedModel.shortName;
    }
  }

  // Fallback to user message based title
  return generateTitleFromUserMessage(userMessage, opts);
}

// New function to generate title using model name
export function generateModelBasedTitle(selectedModelId: string): string {
  const selectedModel = chatModels.find(
    (model) => model.id === selectedModelId,
  );
  return selectedModel?.shortName || 'New Chat';
}

function generateFallbackTitle(
  message: string,
  options: TitleGenerationOptions,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Remove common prefixes
  let title = message
    .replace(
      /^(i want to|can you|please|help me|how do i|what is|explain|tell me about)\s+/i,
      '',
    )
    .trim();

  // Extract key terms for shorter, more meaningful titles
  const keyTerms = extractKeyTerms(title);

  if (keyTerms.length > 0) {
    // Combine key terms with year if present
    const yearMatch = title.match(/\b(20\d{2}|19\d{2})\b/);
    const year = yearMatch ? yearMatch[0] : '';

    if (year && keyTerms.length > 0) {
      // Format: "Key Term Year" (e.g., "AI Tech 2025")
      const mainTerm = keyTerms[0];
      return `${mainTerm} ${year}`;
    } else if (keyTerms.length >= 2) {
      // Format: "Term1 Term2" (e.g., "AI Technology")
      return keyTerms.slice(0, 2).join(' ');
    } else if (keyTerms.length === 1) {
      // Single key term
      return keyTerms[0];
    }
  }

  // Fallback: Take first sentence or first 6 words (reduced from 8)
  const sentences = title.split(/[.!?]/);
  title = sentences[0] || title;

  const words = title.split(' ').slice(0, 6);
  title = words.join(' ');

  // Ensure it doesn't exceed max length and doesn't end with incomplete words
  if (title.length > (opts.maxLength ?? 40)) {
    const truncated = title.substring(0, (opts.maxLength ?? 40) - 3);
    // Find the last complete word
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      title = truncated.substring(0, lastSpaceIndex);
    } else {
      title = truncated;
    }
  }

  // Add question mark if it's a question and option is enabled
  if (
    opts.includeQuestionMark &&
    /^(what|how|why|when|where|which|who|is|are|can|could|would|will|do|does|did)/i.test(
      title,
    )
  ) {
    title = `${title.replace(/[.!?]$/, '')}?`;
  }

  return title || 'New Chat';
}

function extractKeyTerms(text: string): string[] {
  // Common important terms that should be prioritized
  const importantTerms = [
    'AI',
    'artificial intelligence',
    'machine learning',
    'ML',
    'deep learning',
    'technology',
    'tech',
    'programming',
    'code',
    'software',
    'app',
    'application',
    'data',
    'database',
    'API',
    'web',
    'mobile',
    'cloud',
    'security',
    'cybersecurity',
    'blockchain',
    'crypto',
    'bitcoin',
    'ethereum',
    'NFT',
    'metaverse',
    'VR',
    'AR',
    'robotics',
    'automation',
    'IoT',
    'internet of things',
    '5G',
    'quantum',
    'algorithm',
    'neural network',
    'GPT',
    'chatbot',
    'automation',
    'analytics',
    'business',
    'startup',
    'entrepreneurship',
    'marketing',
    'finance',
    'healthcare',
    'education',
    'research',
    'science',
    'medicine',
    'climate',
    'environment',
    'sustainability',
    'renewable',
    'energy',
    'solar',
    'wind',
    'electric',
    'EV',
    'autonomous',
    'self-driving',
    'drone',
    'satellite',
    'space',
    'NASA',
    'spacex',
    'CRISPR',
    'gene editing',
    'biotechnology',
    'genetics',
    'DNA',
    'RNA',
    'quantum computing',
    'quantum',
    'computing',
    'cryptography',
    'encryption',
    'neural networks',
    'computer vision',
    'natural language processing',
    'NLP',
    'big data',
    'analytics',
    'machine learning',
    'deep learning',
    'reinforcement learning',
    'computer science',
    'software engineering',
    'web development',
    'mobile development',
    'game development',
    'data science',
    'statistics',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'medicine',
    'healthcare',
    'pharmaceuticals',
    'drugs',
    'climate change',
    'global warming',
    'environmental science',
    'ecology',
    'renewable energy',
    'solar power',
    'wind power',
    'nuclear energy',
    'fossil fuels',
    'electric vehicles',
    'autonomous vehicles',
    'self-driving cars',
    'transportation',
    'aerospace',
    'aviation',
    'space exploration',
    'satellite technology',
    'internet',
    'social media',
    'digital marketing',
    'e-commerce',
    'online business',
    'cybersecurity',
    'privacy',
    'data protection',
    'information security',
    'artificial intelligence',
    'robotics',
    'automation',
    'industrial automation',
    'smart cities',
    'IoT',
    'internet of things',
    'smart home',
    'wearable technology',
    'virtual reality',
    'augmented reality',
    'mixed reality',
    'gaming',
    'entertainment',
    'music',
    'art',
    'design',
    'architecture',
    'engineering',
    'construction',
    'agriculture',
    'farming',
    'food technology',
    'nutrition',
    'diet',
    'fitness',
    'sports',
    'exercise',
    'health',
    'wellness',
    'mental health',
    'psychology',
    'sociology',
    'anthropology',
    'history',
    'geography',
    'economics',
    'finance',
    'banking',
    'investment',
    'cryptocurrency',
    'blockchain technology',
    'DeFi',
    'education',
    'learning',
    'teaching',
    'academic',
    'university',
    'college',
    'research',
    'scientific method',
    'experiments',
    'laboratory',
    'discovery',
    'innovation',
    'invention',
    'patent',
    'intellectual property',
    'copyright',
    'legal',
    'law',
    'politics',
    'government',
    'democracy',
    'elections',
    'voting',
    'human rights',
    'civil rights',
    'social justice',
    'equality',
    'diversity',
    'inclusion',
    'discrimination',
    'racism',
    'sexism',
    'prejudice',
    'bias',
    'ethics',
    'morality',
    'philosophy',
    'religion',
    'spirituality',
    'beliefs',
    'culture',
    'society',
    'community',
    'family',
    'relationships',
    'marriage',
    'parenting',
    'children',
    'youth',
    'elderly',
    'aging',
    'retirement',
    'pension',
    'insurance',
    'healthcare',
    'medical',
    'hospital',
    'doctor',
    'nurse',
    'patient',
    'treatment',
    'therapy',
    'medication',
    'drugs',
    'pharmaceuticals',
    'vaccine',
    'immunization',
    'disease',
    'infection',
    'virus',
    'bacteria',
    'pathogen',
    'epidemic',
    'pandemic',
    'outbreak',
    'contagion',
    'quarantine',
    'isolation',
    'social distancing',
    'mask',
    'sanitizer',
    'hygiene',
    'cleanliness',
    'sanitation',
  ];

  const words = text.toLowerCase().split(/\s+/);
  const keyTerms: string[] = [];

  // First, look for important multi-word terms (longer terms first)
  const sortedTerms = importantTerms.sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      // Extract the term with proper capitalization
      const termRegex = new RegExp(term, 'i');
      const match = text.match(termRegex);
      if (
        match &&
        !keyTerms.some((existing) =>
          existing.toLowerCase().includes(term.toLowerCase()),
        )
      ) {
        keyTerms.push(match[0]);
      }
    }
  }

  // Then add single important words that aren't already included
  const singleImportantWords = [
    'ai',
    'ml',
    'tech',
    'app',
    'api',
    'web',
    'data',
    'code',
    'vr',
    'ar',
    'iot',
    'gpt',
    'crypto',
    'nft',
    'ev',
    '5g',
    'quantum',
    'blockchain',
    'automation',
    'crispr',
    'gene',
    'dna',
    'rna',
    'quantum',
    'computing',
    'neural',
    'network',
    'vision',
    'nlp',
    'analytics',
    'learning',
    'science',
    'engineering',
    'development',
    'statistics',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'medicine',
    'climate',
    'energy',
    'solar',
    'wind',
    'nuclear',
    'electric',
    'autonomous',
    'space',
    'satellite',
    'internet',
    'social',
    'digital',
    'cybersecurity',
    'privacy',
    'robotics',
    'smart',
    'iot',
    'virtual',
    'augmented',
    'gaming',
    'music',
    'art',
    'design',
    'architecture',
    'agriculture',
    'farming',
    'food',
    'nutrition',
    'fitness',
    'health',
    'psychology',
    'sociology',
    'history',
    'economics',
    'finance',
    'banking',
    'education',
    'research',
    'innovation',
    'legal',
    'politics',
    'government',
    'rights',
    'justice',
    'ethics',
    'culture',
    'family',
    'children',
    'elderly',
    'insurance',
    'medical',
    'treatment',
    'disease',
    'virus',
    'pandemic',
    'hygiene',
  ];

  for (const word of words) {
    if (
      singleImportantWords.includes(word) &&
      !keyTerms.some((term) => term.toLowerCase().includes(word))
    ) {
      keyTerms.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
  }

  // Remove duplicates and limit to 3 terms
  const uniqueTerms = [...new Set(keyTerms)].slice(0, 3);

  return uniqueTerms;
}
