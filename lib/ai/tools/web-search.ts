import { tool } from 'ai';
import { z } from 'zod';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  favicon?: string;
  timestamp?: string;
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
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
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

  throw lastError!;
};

export const webSearch = tool({
  description:
    'Search the web for current information and articles using DuckDuckGo. Returns formatted results with sources, snippets, and metadata for display in AI applications.',
  inputSchema: z.object({
    query: z
      .string()
      .min(1, 'Query cannot be empty')
      .max(500, 'Query too long')
      .describe('The search query to find articles and information about'),
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
  }),

  execute: async ({
    query,
    limit = 10,
    safeSearch = true,
  }): Promise<SearchResponse> => {
    const startTime = Date.now();

    try {
      // Validate and sanitize input
      const cleanQuery = sanitizeText(query).substring(0, 500);
      if (!cleanQuery) {
        throw new Error('Invalid or empty search query');
      }

      // Build search URLs for multiple endpoints
      const searchUrls = [
        // Primary: DuckDuckGo Instant Answer API
        `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1&safe_search=${safeSearch ? 'strict' : 'off'}`,

        // Fallback: Alternative endpoint structure
        `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&pretty=1&no_redirect=1&safe_search=${safeSearch ? 'strict' : 'off'}`,
      ];

      let searchData: any = null;
      let usedEndpoint = '';

      // Try each endpoint until one works
      for (const searchUrl of searchUrls) {
        try {
          const response = await fetchWithRetry(searchUrl);
          searchData = await response.json();
          usedEndpoint = searchUrl;
          break;
        } catch (error) {
          console.warn(`Failed to fetch from ${searchUrl}:`, error);
          continue;
        }
      }

      if (!searchData) {
        throw new Error('All search endpoints failed');
      }

      const results: SearchResult[] = [];
      const processedUrls = new Set<string>();

      // Process Abstract (main result)
      if (
        searchData.Abstract &&
        searchData.AbstractURL &&
        isValidUrl(searchData.AbstractURL)
      ) {
        const abstractUrl = searchData.AbstractURL;
        if (!processedUrls.has(abstractUrl)) {
          results.push({
            title: sanitizeText(
              searchData.AbstractSource ||
                searchData.Heading ||
                'Featured Result',
            ),
            url: abstractUrl,
            snippet: sanitizeText(searchData.Abstract),
            source: extractDomain(abstractUrl),
            favicon: generateFaviconUrl(abstractUrl),
            timestamp: new Date().toISOString(),
          });
          processedUrls.add(abstractUrl);
        }
      }

      // Process Definition if available
      if (
        searchData.Definition &&
        searchData.DefinitionURL &&
        isValidUrl(searchData.DefinitionURL)
      ) {
        const defUrl = searchData.DefinitionURL;
        if (!processedUrls.has(defUrl) && results.length < limit) {
          results.push({
            title: sanitizeText(searchData.DefinitionSource || 'Definition'),
            url: defUrl,
            snippet: sanitizeText(searchData.Definition),
            source: extractDomain(defUrl),
            favicon: generateFaviconUrl(defUrl),
            timestamp: new Date().toISOString(),
          });
          processedUrls.add(defUrl);
        }
      }

      // Process Related Topics
      if (searchData.RelatedTopics && Array.isArray(searchData.RelatedTopics)) {
        searchData.RelatedTopics.filter(
          (topic: any) => topic && topic.Text && topic.FirstURL,
        )
          .slice(0, limit - results.length)
          .forEach((topic: any) => {
            const topicUrl = topic.FirstURL;
            if (isValidUrl(topicUrl) && !processedUrls.has(topicUrl)) {
              const title = sanitizeText(
                topic.Text.split(' - ')[0] || topic.Text,
              );
              if (title) {
                results.push({
                  title,
                  url: topicUrl,
                  snippet: sanitizeText(topic.Text),
                  source: extractDomain(topicUrl),
                  favicon: generateFaviconUrl(topicUrl),
                  timestamp: new Date().toISOString(),
                });
                processedUrls.add(topicUrl);
              }
            }
          });
      }

      // Process Results array if available
      if (searchData.Results && Array.isArray(searchData.Results)) {
        searchData.Results.filter(
          (result: any) => result && result.Text && result.FirstURL,
        )
          .slice(0, limit - results.length)
          .forEach((result: any) => {
            const resultUrl = result.FirstURL;
            if (isValidUrl(resultUrl) && !processedUrls.has(resultUrl)) {
              const title = sanitizeText(
                result.Text.split(' - ')[0] || result.Text,
              );
              if (title) {
                results.push({
                  title,
                  url: resultUrl,
                  snippet: sanitizeText(result.Text),
                  source: extractDomain(resultUrl),
                  favicon: generateFaviconUrl(resultUrl),
                  timestamp: new Date().toISOString(),
                });
                processedUrls.add(resultUrl);
              }
            }
          });
      }

      // Add direct answer as a result if available
      if (searchData.Answer) {
        const answerText = sanitizeText(searchData.Answer);
        if (answerText && results.length < limit) {
          results.push({
            title: 'Direct Answer',
            url: searchData.AbstractURL || '',
            snippet: answerText,
            source: 'DuckDuckGo',
            favicon: '',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Generate search suggestions based on related topics
      const suggestions: string[] = [];
      if (searchData.RelatedTopics) {
        searchData.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text) {
            const suggestion = sanitizeText(topic.Text.split(' - ')[0]);
            if (suggestion && suggestion !== cleanQuery) {
              suggestions.push(suggestion);
            }
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
          message: `No specific results found for "${cleanQuery}". Try rephrasing your search or using different keywords.`,
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
        message: `Found ${results.length} relevant result${results.length === 1 ? '' : 's'} for "${cleanQuery}" in ${executionTime}ms.`,
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
