'use client';

import { useMessageLimit } from './message-limit-provider';
import { useSession } from 'next-auth/react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { MessageSquare, Zap } from 'lucide-react';

export function UsageCounter() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.type === 'admin';
  const messageLimitData = useMessageLimit();

  // Check if the hook is available
  if (!messageLimitData) {
    return null;
  }

  const { messagesUsed, messagesLimit, remaining, isGuest, isLoading } =
    messageLimitData;

  // Don't show if loading
  if (isLoading) return null;

  // For guests, show after first message or if they have used messages
  if (isGuest && messagesUsed === 0) return null;

  // Admin users get infinity display
  if (isAdmin) {
    return (
      <div className="w-full p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/60 dark:border-zinc-700/60 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Admin Usage
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {messagesUsed}
            </span>
            <span className="text-lg text-purple-600 dark:text-purple-400 font-bold">∞</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-full bg-purple-500 transition-all" style={{ width: '100%' }} />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span className="text-purple-600 dark:text-purple-400 font-medium">Unlimited Messages</span>
            <div className="flex items-center gap-1">
              <Zap className="size-3" />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show if loading
  if (isLoading) return null;

  // For guests, show after first message or if they have used messages
  if (isGuest && messagesUsed === 0) return null;

  // Calculate usage percentage
  const usagePercent = Math.min((messagesUsed / messagesLimit) * 100, 100);

  // Determine color based on usage
  const getProgressColor = () => {
    if (remaining === 0) return 'bg-red-500';
    if (usagePercent >= 90) return 'bg-red-500';
    if (usagePercent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBadgeColor = () => {
    if (remaining === 0)
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
    if (usagePercent >= 90)
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
    if (usagePercent >= 75)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800';
  };

  const getContainerColor = () => {
    if (remaining === 0) {
      return 'bg-red-50/80 dark:bg-red-950/80 backdrop-blur-xl border-red-200/60 dark:border-red-800/60';
    }
    return 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200/60 dark:border-zinc-700/60';
  };

  return (
    <div className={`w-full p-4 ${getContainerColor()} rounded-xl shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isGuest ? 'Guest Usage' : 'Daily Usage'}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs font-medium ${getBadgeColor()}`}
        >
          {messagesUsed}/{messagesLimit}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full transition-all ${getProgressColor()}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>{remaining} messages remaining</span>
          <div className="flex items-center gap-1">
            <Zap className="size-3" />
            <span>{isGuest ? 'Guest' : 'Regular'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
