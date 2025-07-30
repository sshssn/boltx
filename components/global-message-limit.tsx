'use client';

import { useMessageLimit } from './message-limit-provider';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Brain, History, X } from 'lucide-react';

export function GlobalMessageLimit() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const dismissedRef = useRef(false);
  const lastDismissTimeRef = useRef(0);

  const {
    messagesUsed,
    messagesLimit,
    isLoading,
    isGuest,
    isRegular,
    remaining,
    hasReachedLimit,
  } = useMessageLimit();

  const handleDismiss = useCallback(() => {
    dismissedRef.current = true;
    lastDismissTimeRef.current = Date.now();
    setOpen(false);
  }, []);

  const handleSignUp = useCallback(() => {
    dismissedRef.current = true;
    lastDismissTimeRef.current = Date.now();
    window.location.href = 'http://localhost:3000/auth';
    setOpen(false);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      dismissedRef.current = true;
      lastDismissTimeRef.current = Date.now();
    }
    setOpen(newOpen);
  }, []);

  // Show modal when limit is reached (with cooldown)
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastDismiss = now - lastDismissTimeRef.current;
    const cooldownPeriod = 5000; // 5 seconds cooldown

    if (
      remaining <= 0 &&
      !open &&
      !dismissedRef.current &&
      timeSinceLastDismiss > cooldownPeriod
    ) {
      setOpen(true);
    }
  }, [remaining, open]);

  // Don't show if loading, for unlimited users
  if (isLoading || messagesLimit >= 1000) return null;

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: '50 tokens daily',
      description: 'Generous daily message allowance',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Lightning-fast premium models',
      description: 'Access to cutting-edge AI',
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI remembers your conversations',
      description: 'Context-aware responses',
    },
    {
      icon: <History className="w-5 h-5" />,
      title: 'Chat history',
      description: 'Never lose your conversations',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-lg mx-2 sm:mx-4 p-0 border-0 bg-transparent shadow-none">
        <div className="relative">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-yellow-300/15 to-yellow-500/25 dark:from-yellow-600/30 dark:via-yellow-500/25 dark:to-yellow-700/35 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-yellow-300/30 dark:border-yellow-600/50 shadow-2xl" />

          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-yellow-300/8 to-yellow-500/12 dark:from-yellow-600/15 dark:via-yellow-500/12 dark:to-yellow-700/18 rounded-xl sm:rounded-2xl" />

          {/* Content */}
          <div className="relative p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 sm:space-y-3">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
                {remaining} messages left
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-base leading-relaxed">
                You&apos;ve used all your free messages. Sign up to continue the
                conversation.
              </p>
            </div>

            {/* Feature Cards - Compact on mobile */}
            <div className="space-y-2 sm:space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative p-2.5 sm:p-4 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg sm:rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/90 dark:hover:bg-zinc-800/90 hover:border-zinc-300/70 dark:hover:border-zinc-600/70 hover:shadow-lg"
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-20" />

                  <div className="relative flex items-start gap-2.5 sm:gap-4">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-400/30 dark:to-purple-400/30 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                className="flex-1 h-9 sm:h-12 font-medium bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-white/90 dark:hover:bg-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-600 backdrop-blur-sm transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 text-xs sm:text-sm"
                onClick={handleDismiss}
              >
                Maybe later
              </Button>
              <Button
                className="flex-1 h-9 sm:h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 text-xs sm:text-sm"
                onClick={handleSignUp}
              >
                Sign up
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full bg-white/20 dark:bg-zinc-800/20 hover:bg-white/30 dark:hover:bg-zinc-800/30 backdrop-blur-sm border border-white/30 dark:border-zinc-700/30"
              onClick={handleDismiss}
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
