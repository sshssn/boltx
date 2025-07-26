'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingMessageProps {
  message?: string;
  isTyping?: boolean;
}

export function LoadingMessage({
  message = '',
  isTyping = false,
}: LoadingMessageProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white/5 dark:bg-zinc-800/20 backdrop-blur-sm rounded-2xl border border-white/10 dark:border-zinc-700/50">
      {/* Avatar */}
      <div className="shrink-0 size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <Sparkles className="size-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            AI Assistant
          </span>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <Loader2 className="size-3 text-indigo-500" />
            </motion.div>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <motion.div
            className="size-2 bg-indigo-500 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0,
            }}
          />
          <motion.div
            className="size-2 bg-indigo-500 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.2,
            }}
          />
          <motion.div
            className="size-2 bg-indigo-500 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: 0.4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
