import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<string>;
}

export const entitlementsByUserType: Record<string, Entitlements> = {
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['gpt-5.1'],
  },
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['gpt-5.1', 'gpt-5.2'],
  },
  pro: {
    maxMessagesPerDay: 500,
    availableChatModelIds: [
      'gpt-5.1',
      'gpt-5.2',
      'deepseek/deepseek-r1-0528:free',
    ],
  },
  admin: {
    maxMessagesPerDay: -1, // Unlimited
    availableChatModelIds: [
      'gpt-5.1',
      'gpt-5.2',
      'deepseek/deepseek-r1-0528:free',
    ],
  },
};
