export const DEFAULT_CHAT_MODEL: string = 'gemini-2.5-flash';

export interface ChatModel {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    shortName: 'Gemini 2.5',
    description: 'Fastest and most capable model for all-purpose chat',
  },
];
