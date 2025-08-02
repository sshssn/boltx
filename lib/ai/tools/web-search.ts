import { tool } from 'ai';
import { z } from 'zod';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  favicon?: string;
  timestamp?: string;
  type?: 'web' | 'news' | 'images' | 'videos' | 'goggles';
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: string;
  message: string;
  error?: string;
  formattedSources?: {
    title: string;
    url: string;
    snippet: string;
    favicon?: string;
  }[];
  suggestions?: string[];
}

// Rate limiting for Brave API
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const DAILY_LIMIT = 7; // Increased from 5 to 7 calls per day for better UX

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const today = new Date().toDateString();
  const key = `${userId}-${today}`;

  const limit = rateLimitMap.get(key);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
    return true;
  }

  if (limit.count >= DAILY_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
};

// Utility functions for robust processing
const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return 'Unknown Source';
  }
};

const generateFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
};

// Enhanced retry mechanism with exponential backoff
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
): Promise<Response> => {
  let lastError = new Error('Unknown error occurred');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; WebSearchBot/2.0; +https://example.com/bot)',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Handle specific error codes with appropriate responses
      if (response.status === 422) {
        throw new Error(
          `HTTP 422: Invalid request parameters. Please check your search query.`,
        );
      }

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Handle other client errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `HTTP ${response.status}: Client error - ${response.statusText}`,
        );
      }

      // Handle server errors
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export const webSearch = tool({
  description:
    'Search the web for current information using Brave Search API. Supports web search, news, images, and videos. Limited to 5 calls per day for registered users.',
  inputSchema: z.object({
    query: z
      .string()
      .min(1, 'Query cannot be empty')
      .max(500, 'Query too long')
      .describe('The search query to find articles and information about'),
    searchType: z
      .enum(['web', 'news', 'images', 'videos', 'goggles'])
      .default('web')
      .optional()
      .describe('Type of search to perform'),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .optional()
      .describe('Maximum number of results to return (1-20)'),
    safeSearch: z
      .boolean()
      .default(true)
      .optional()
      .describe('Enable safe search filtering'),
    userId: z.string().optional().describe('User ID for rate limiting'),
  }),

  execute: async ({
    query,
    searchType = 'web',
    limit = 10,
    safeSearch = true,
    userId = 'guest',
  }): Promise<SearchResponse> => {
    // Check if Brave API key is configured
    if (!BRAVE_API_KEY) {
      return {
        query: query || '',
        results: [],
        totalResults: 0,
        searchTime: new Date().toISOString(),
        error: 'Web search not configured',
        message: 'Web search is not configured. Please contact support.',
        suggestions: [],
      };
    }

    const startTime = Date.now();

    try {
      // Check rate limit
      if (!checkRateLimit(userId || 'guest')) {
        return {
          query: query || '',
          results: [],
          totalResults: 0,
          searchTime: new Date().toISOString(),
          error: 'Rate limit exceeded',
          message:
            'You have reached your daily search limit (5 searches per day). Please try again tomorrow.',
          suggestions: [],
        };
      }

      // Validate and sanitize input
      const cleanQuery = sanitizeText(query).substring(0, 500);
      if (!cleanQuery) {
        throw new Error('Invalid or empty search query');
      }

      // Use Brave Search API with the provided key
      const braveSearchUrl = 'https://api.search.brave.com/res/v1/web/search';
      const searchParams = new URLSearchParams({
        q: cleanQuery,
        count: limit.toString(),
        search_lang: 'en_US',
        ui_lang: 'en',
        country: 'US',
        safesearch: safeSearch ? 'strict' : 'off',
        api_key: BRAVE_API_KEY,
      });

      // Add search type specific parameters
      if (searchType === 'news') {
        searchParams.append('news', '1');
      } else if (searchType === 'images') {
        searchParams.append('images', '1');
      } else if (searchType === 'videos') {
        searchParams.append('videos', '1');
      }

      const response = await fetchWithRetry(
        `${braveSearchUrl}?${searchParams}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const searchData = await response.json();

      if (!searchData || !searchData.web || !searchData.web.results) {
        throw new Error('Invalid response from Brave Search API');
      }

      const results: SearchResult[] = [];
      const processedUrls = new Set<string>();

      // Process Brave Search results based on search type
      const searchResults =
        searchType === 'news' && searchData.news?.results
          ? searchData.news.results
          : searchType === 'images' && searchData.images?.results
            ? searchData.images.results
            : searchType === 'videos' && searchData.videos?.results
              ? searchData.videos.results
              : searchData.web.results || [];

      // Process results
      searchResults.slice(0, limit).forEach((result: any) => {
        if (
          result.url &&
          isValidUrl(result.url) &&
          !processedUrls.has(result.url)
        ) {
          results.push({
            title: sanitizeText(result.title || 'Untitled'),
            url: result.url,
            snippet: sanitizeText(result.description || ''),
            source: extractDomain(result.url),
            favicon: result.profile?.favicon || generateFaviconUrl(result.url),
            timestamp: new Date().toISOString(),
            type: searchType,
          });
          processedUrls.add(result.url);
        }
      });

      // Generate search suggestions based on Brave Search suggestions
      const suggestions: string[] = [];
      if (
        searchData.web.suggestions &&
        Array.isArray(searchData.web.suggestions)
      ) {
        searchData.web.suggestions.slice(0, 3).forEach((suggestion: string) => {
          const cleanSuggestion = sanitizeText(suggestion);
          if (cleanSuggestion && cleanSuggestion !== cleanQuery) {
            suggestions.push(cleanSuggestion);
          }
        });
      }

      const searchTime = new Date().toISOString();
      const executionTime = Date.now() - startTime;

      // Handle no results case
      if (results.length === 0) {
        return {
          query: cleanQuery,
          results: [],
          totalResults: 0,
          message: `No ${searchType} results found for "${cleanQuery}". Try rephrasing your search or using different keywords.`,
          searchTime,
          suggestions:
            suggestions.length > 0
              ? suggestions
              : [
                  `${cleanQuery} news`,
                  `${cleanQuery} 2025`,
                  `what is ${cleanQuery}`,
                ],
        };
      }

      // Format sources for frontend display
      const formattedSources = results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        favicon: result.favicon,
      }));

      return {
        query: cleanQuery,
        results: results.slice(0, limit),
        totalResults: results.length,
        searchTime,
        message: `Found ${results.length} relevant ${searchType} result${results.length === 1 ? '' : 's'} for "${cleanQuery}" in ${executionTime}ms.`,
        formattedSources,
        suggestions,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Web search error:', error);

      // Determine error type for better user messaging
      let errorMessage =
        'Search service temporarily unavailable. Please try again later.';

      if (error instanceof Error) {
        if (
          error.message.includes('AbortError') ||
          error.message.includes('timeout')
        ) {
          errorMessage =
            'Search request timed out. Please try a more specific query.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          errorMessage =
            'Network connection error. Please check your internet and try again.';
        } else if (error.message.includes('429')) {
          errorMessage =
            'Search rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('422')) {
          errorMessage =
            'Invalid search query. Please try a different search term.';
        }
      }

      return {
        query: query || '',
        results: [],
        totalResults: 0,
        searchTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: errorMessage,
        suggestions: [],
      };
    }
  },
});

// Direct web search function for use outside of AI SDK
export async function performWebSearch({
  query,
  searchType = 'web',
  limit = 10,
  safeSearch = true,
  userId = 'guest',
}: {
  query: string;
  searchType?: 'web' | 'news' | 'images' | 'videos' | 'goggles';
  limit?: number;
  safeSearch?: boolean;
  userId?: string;
}): Promise<SearchResponse> {
  // Check if Brave API key is configured
  if (!BRAVE_API_KEY) {
    return {
      query: query || '',
      results: [],
      totalResults: 0,
      searchTime: new Date().toISOString(),
      error: 'Web search not configured',
      message: 'Web search is not configured. Please contact support.',
      suggestions: [],
    };
  }

  const startTime = Date.now();

  try {
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return {
        query: query || '',
        results: [],
        totalResults: 0,
        searchTime: new Date().toISOString(),
        error: 'Rate limit exceeded',
        message:
          'You have reached your daily search limit (5 searches per day). Please try again tomorrow.',
        suggestions: [],
      };
    }

    // Validate and sanitize input
    const cleanQuery = sanitizeText(query).substring(0, 500);
    if (!cleanQuery) {
      throw new Error('Invalid or empty search query');
    }

    // Use Brave Search API with the provided key
    const braveSearchUrl = 'https://api.search.brave.com/res/v1/web/search';
    const searchParams = new URLSearchParams({
      q: cleanQuery,
      count: limit.toString(),
      search_lang: 'en_US',
      ui_lang: 'en',
      country: 'US',
      safesearch: safeSearch ? 'strict' : 'off',
      api_key: BRAVE_API_KEY,
    });

    // Add search type specific parameters
    if (searchType === 'news') {
      searchParams.append('news', '1');
    } else if (searchType === 'images') {
      searchParams.append('images', '1');
    } else if (searchType === 'videos') {
      searchParams.append('videos', '1');
    }

    const response = await fetchWithRetry(`${braveSearchUrl}?${searchParams}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    const searchData = await response.json();

    if (!searchData || !searchData.web || !searchData.web.results) {
      throw new Error('Invalid response from Brave Search API');
    }

    const results: SearchResult[] = [];
    const processedUrls = new Set<string>();

    // Process Brave Search results based on search type
    const searchResults =
      searchType === 'news' && searchData.news?.results
        ? searchData.news.results
        : searchType === 'images' && searchData.images?.results
          ? searchData.images.results
          : searchType === 'videos' && searchData.videos?.results
            ? searchData.videos.results
            : searchData.web.results || [];

    // Process results
    searchResults.slice(0, limit).forEach((result: any) => {
      if (
        result.url &&
        isValidUrl(result.url) &&
        !processedUrls.has(result.url)
      ) {
        results.push({
          title: sanitizeText(result.title || 'Untitled'),
          url: result.url,
          snippet: sanitizeText(result.description || ''),
          source: extractDomain(result.url),
          favicon: result.profile?.favicon || generateFaviconUrl(result.url),
          timestamp: new Date().toISOString(),
          type: searchType,
        });
        processedUrls.add(result.url);
      }
    });

    // Generate search suggestions based on Brave Search suggestions
    const suggestions: string[] = [];
    if (
      searchData.web.suggestions &&
      Array.isArray(searchData.web.suggestions)
    ) {
      searchData.web.suggestions.slice(0, 3).forEach((suggestion: string) => {
        const cleanSuggestion = sanitizeText(suggestion);
        if (cleanSuggestion && cleanSuggestion !== cleanQuery) {
          suggestions.push(cleanSuggestion);
        }
      });
    }

    const searchTime = new Date().toISOString();
    const executionTime = Date.now() - startTime;

    // Handle no results case
    if (results.length === 0) {
      return {
        query: cleanQuery,
        results: [],
        totalResults: 0,
        message: `No ${searchType} results found for "${cleanQuery}". Try rephrasing your search or using different keywords.`,
        searchTime,
        suggestions:
          suggestions.length > 0
            ? suggestions
            : [
                `${cleanQuery} news`,
                `${cleanQuery} 2025`,
                `what is ${cleanQuery}`,
              ],
      };
    }

    // Format sources for frontend display
    const formattedSources = results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      favicon: result.favicon,
    }));

    return {
      query: cleanQuery,
      results: results.slice(0, limit),
      totalResults: results.length,
      searchTime,
      message: `Found ${results.length} relevant ${searchType} result${results.length === 1 ? '' : 's'} for "${cleanQuery}" in ${executionTime}ms.`,
      formattedSources,
      suggestions,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Web search error:', error);

    // Determine error type for better user messaging
    let errorMessage =
      'Search service temporarily unavailable. Please try again later.';

    if (error instanceof Error) {
      if (
        error.message.includes('AbortError') ||
        error.message.includes('timeout')
      ) {
        errorMessage =
          'Search request timed out. Please try a more specific query.';
      } else if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        errorMessage =
          'Network connection error. Please check your internet and try again.';
      } else if (error.message.includes('429')) {
        errorMessage =
          'Search rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('422')) {
        errorMessage =
          'Invalid search query. Please try a different search term.';
      }
    }

    return {
      query: query || '',
      results: [],
      totalResults: 0,
      searchTime: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: errorMessage,
      suggestions: [],
    };
  }
}
