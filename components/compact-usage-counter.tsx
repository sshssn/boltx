'use client';

import { useMessageLimit } from './message-limit-provider';
import { useSession } from 'next-auth/react';
import { useSidebar } from './ui/sidebar';
import { Button } from './ui/button';
import { MessageSquare, Settings, X } from 'lucide-react';
import { useState } from 'react';

export function CompactUsageCounter() {
  const { data: session } = useSession();
  const { open } = useSidebar();
  const [isDismissed, setIsDismissed] = useState(false);
  const { messagesUsed, messagesLimit, remaining, isGuest, isLoading } =
    useMessageLimit();

  // Don't show if loading, if sidebar is open, if dismissed, or if guest hasn't used any messages
  if (isLoading || open || isDismissed || (isGuest && messagesUsed === 0))
    return null;

  // Don't show if user has unlimited messages
  if (messagesLimit >= 1000) return null;

  return (
    <div className="flex items-center justify-center px-4 py-2 mb-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 rounded-lg shadow-sm relative">
        <MessageSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          You have{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {remaining}
          </span>{' '}
          messages left
        </span>
        {isGuest ? (
          <Button
            variant="link"
            size="sm"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
            onClick={() => {
              window.location.href = '/auth';
            }}
          >
            Sign in to reset
          </Button>
        ) : (
          <Button
            variant="link"
            size="sm"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto flex items-center gap-1"
            onClick={() => {
              window.location.href = '/account';
            }}
          >
            <Settings className="w-3 h-3" />
            View usage
          </Button>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 hover:bg-zinc-300/80 dark:hover:bg-zinc-600/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          onClick={() => setIsDismissed(true)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
