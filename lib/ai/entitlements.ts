import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ['gemini-2.5-flash'],
  },
  regular: {
    maxMessagesPerDay: 50,
    availableChatModelIds: ['gemini-2.5-flash'],
  },
  pro: {
    maxMessagesPerDay: 500,
    availableChatModelIds: ['gemini-2.5-flash'],
  },
};
