export const DEFAULT_CHAT_MODEL: string = 'gemini-2.0-flash-exp';

export interface ChatModel {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    shortName: 'Gemini Flash',
    description: 'Fastest and most capable model for all-purpose chat',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 (Free)',
    shortName: 'DeepSeek R1',
    description: 'Advanced reasoning model for complex problem solving',
  },
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma 3N E2B (Free)',
    shortName: 'Gemma 3N',
    description: 'Efficient and reliable model for general conversation',
  },
];
