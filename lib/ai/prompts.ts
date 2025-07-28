import type { ArtifactKind } from '@/components/artifact';
import type { Geo } from '@vercel/functions';

export const artifactsPrompt = `
Use artifacts for code and substantial content. Create documents for code, emails, essays. Update only when requested. Don't update immediately after creation.
`;

export const regularPrompt = 'Be helpful and concise.';

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

  return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}`;
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
