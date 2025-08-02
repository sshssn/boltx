import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerDay: 10,
    availableChatModelIds: ['gemini-2.0-flash-exp'],
  },
  regular: {
    maxMessagesPerDay: 25,
    availableChatModelIds: [
      'gemini-2.0-flash-exp',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen2.5-7b-instruct:free',
    ],
  },
  pro: {
    maxMessagesPerDay: 500,
    availableChatModelIds: [
      'gemini-2.0-flash-exp',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen2.5-7b-instruct:free',
      'deepseek/deepseek-r1-0528:free',
      'google/gemma-3n-e2b-it:free',
    ],
  },
  admin: {
    maxMessagesPerDay: -1, // Unlimited
    availableChatModelIds: [
      'gemini-2.0-flash-exp',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen2.5-7b-instruct:free',
      'deepseek/deepseek-r1-0528:free',
      'google/gemma-3n-e2b-it:free',
    ],
  },
};
