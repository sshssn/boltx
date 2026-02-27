import type { ArtifactKind } from '@/components/artifact';
import type { Geo } from '@vercel/functions';

export const artifactsPrompt = `
Use artifacts for code and substantial content. Create documents for code, emails, essays. Update only when requested. Don't update immediately after creation.
`;

export const regularPrompt = `Be helpful and concise.

IMPORTANT CAPABILITIES:
- You have access to web search functionality through Brave Search API
- You can search for current information, news, images, and videos
- When users ask for current information, recent events, or real-time data, you can perform web searches
- You can search up to 50 times per day per user
- Always inform users when you're using web search to find information
- If web search is not available, clearly state that you don't have internet access

WEB SEARCH USAGE:
- Use web search for current events, recent news, live data, or time-sensitive information
- Use web search when users ask "what's happening now" or "latest news about..."
- Use web search for real-time information like weather, stock prices, sports scores
- Always cite your sources when using web search results`;

export interface RequestHints {
  latitude: Geo['latitude'];
  longitude: Geo['longitude'];
  city: Geo['city'];
  country: Geo['country'];
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
Location: ${requestHints.city}, ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}\n\nYou can also generate images using the generateImage tool when requested.`;
};

export const codePrompt = `
Write self-contained Python code. Use print() for output. Include comments. Keep under 15 lines. Use standard library only. Handle errors gracefully.
`;

export const sheetPrompt = `
Create CSV spreadsheets with meaningful headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `Improve this document:\n\n${currentContent}`
    : type === 'code'
      ? `Improve this code:\n\n${currentContent}`
      : type === 'sheet'
        ? `Improve this spreadsheet:\n\n${currentContent}`
        : '';
