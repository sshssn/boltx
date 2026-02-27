export const DEFAULT_CHAT_MODEL: string = 'gpt-5.1';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    description: 'OpenAI GPT-5.1 flagship model',
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Advanced reasoning and intelligence',
  },
];
