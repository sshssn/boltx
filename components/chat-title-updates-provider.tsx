'use client';

import { useChatTitleUpdates } from '@/hooks/use-chat-title-updates';

export function ChatTitleUpdatesProvider({
  children,
}: { children: React.ReactNode }) {
  useChatTitleUpdates();

  return <>{children}</>;
}
