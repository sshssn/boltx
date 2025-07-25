'use client';

import { motion } from 'framer-motion';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';
import { useState } from 'react';
import { SparklesIcon, GlobeIcon, CodeIcon, InfoIcon } from './icons';
import { cn } from '@/lib/utils';
import { Greeting } from './greeting';
import React from 'react';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
  setInput?: (value: string) => void;
}

const PRE_PROMPTS = {
  Learn: [
    'Explain the latest breakthroughs in quantum computing (2025).',
    'What are the most important AI trends of 2025?',
    'How does CRISPR gene editing impact health in 2025?',
    'Summarize the global climate initiatives for 2025.',
  ],
  Create: [
    'Write a short story about a robot and a human in 2025.',
    'Compose a poem about Mars colonization.',
    'Draft a professional email for a remote-first company.',
    'Generate a creative ad slogan for a wearable AI assistant.',
  ],
  Explore: [
    'What are the top travel destinations for digital nomads in 2025?',
    'Tell me about the latest tech gadgets of 2025.',
    'What are some unique AI-powered hobbies to try?',
    'Explore the benefits of virtual reality fitness.',
  ],
  Code: [
    'Show me how to use Python 3.13 pattern matching.',
    'Explain the difference between REST, GraphQL, and gRPC in 2025.',
    'Write a SQL query to analyze time-series data.',
    'How do I build a serverless API with edge functions?',
  ],
};

const CATEGORY_ICONS = {
  Create: <SparklesIcon size={20} />,
  Explore: <GlobeIcon size={20} />,
  Code: <CodeIcon size={20} />,
  Learn: <InfoIcon size={20} />,
};

// Subtle, elegant color schemes
const CATEGORY_COLORS = {
  Create: {
    active:
      'bg-purple-500/10 border-purple-300/40 text-purple-700 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400',
    accent: 'bg-purple-400/30',
  },
  Explore: {
    active:
      'bg-blue-500/10 border-blue-300/40 text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-400/30',
  },
  Code: {
    active:
      'bg-emerald-500/10 border-emerald-300/40 text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
    accent: 'bg-emerald-400/30',
  },
  Learn: {
    active:
      'bg-amber-500/10 border-amber-300/40 text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    accent: 'bg-amber-400/30',
  },
};

export function SuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  setInput,
}: SuggestedActionsProps) {
  // No pill highlighted by default, but show prompts for the first category
  const categoryKeys = Object.keys(PRE_PROMPTS) as (keyof typeof PRE_PROMPTS)[];
  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof PRE_PROMPTS | undefined
  >(undefined);

  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const promptVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  // Determine which prompts to show: if no category selected, show first
  const promptsToShow = selectedCategory
    ? PRE_PROMPTS[selectedCategory]
    : PRE_PROMPTS[categoryKeys[0]];

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-8 px-2 sm:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Greeting />
      </motion.div>

      {/* Elegant Category Selector with Frosted Glass */}
      <motion.div
        className="flex flex-row flex-wrap gap-3 text-sm max-sm:justify-evenly"
        variants={itemVariants}
      >
        {categoryKeys.map((cat, index) => (
          <motion.button
            key={cat}
            type="button"
            className={cn(
              'group relative overflow-hidden justify-center whitespace-nowrap text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-12 flex items-center gap-2 rounded-2xl px-6 py-3 font-medium backdrop-blur-xl max-sm:size-20 max-sm:flex-col sm:gap-3 sm:rounded-full border',
              selectedCategory === cat
                ? `${CATEGORY_COLORS[cat].active} shadow-lg backdrop-blur-xl`
                : 'bg-white/40 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-white/20 dark:border-zinc-700/40 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:border-white/40 dark:hover:border-zinc-600/40 backdrop-blur-xl',
            )}
            onClick={() => setSelectedCategory(cat)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Subtle glow effect for selected state */}
            {selectedCategory === cat && (
              <motion.div
                className={cn(
                  'absolute inset-0 -z-10 rounded-2xl sm:rounded-full',
                  CATEGORY_COLORS[cat].accent,
                )}
                layoutId="categoryBackground"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'transition-all duration-300',
                selectedCategory === cat
                  ? CATEGORY_COLORS[cat].icon
                  : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
              )}
            >
              {CATEGORY_ICONS[cat]}
            </div>

            <span className="relative z-10 font-medium tracking-wide">
              {cat}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Elegant Prompts Section with Frosted Glass */}
      <motion.div className="space-y-3 pt-4" variants={itemVariants}>
        <motion.div
          className="grid gap-3"
          key={selectedCategory ?? categoryKeys[0]}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {promptsToShow.map((prompt, idx) => (
            <motion.div
              key={`${selectedCategory}-${prompt}`}
              variants={promptVariants}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <button
                type="button"
                className={cn(
                  'group w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 text-base font-normal relative overflow-hidden backdrop-blur-xl',
                  'bg-[#4B5DFE]/20 dark:bg-zinc-900/30',
                  'border border-white/20 dark:border-zinc-700/30',
                  'hover:bg-white/50 dark:hover:bg-zinc-800/50',
                  'hover:border-white/40 dark:hover:border-zinc-600/40',
                  'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-white/30 dark:focus:ring-zinc-600/50',
                )}
                onClick={() => {
                  if (setInput) setInput(prompt);
                }}
                onMouseEnter={() => setHoveredPrompt(prompt)}
                onMouseLeave={() => setHoveredPrompt(null)}
              >
                {/* Subtle shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors duration-300 leading-relaxed">
                    {prompt}
                  </span>

                  {/* Subtle arrow indicator */}
                  <motion.div
                    className="ml-4 opacity-0 group-hover:opacity-70 transition-all duration-300"
                    initial={{ x: -10, opacity: 0 }}
                    whileHover={{ x: 0, opacity: 0.7 }}
                  >
                    <svg
                      className="size-4 text-zinc-400 dark:text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.div>
                </div>

                {/* Subtle bottom accent */}
                <motion.div
                  className={cn(
                    'absolute bottom-0 left-0 h-px',
                    CATEGORY_COLORS[selectedCategory ?? categoryKeys[0]].accent,
                    'origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300',
                  )}
                  style={{ width: '100%' }}
                />
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Elegant separator */}
        <motion.div
          className="flex items-center justify-center py-6"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-300/40 dark:via-zinc-600/40 to-transparent w-16" />
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors duration-300',
                CATEGORY_COLORS[selectedCategory ?? categoryKeys[0]].accent,
              )}
            />
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-300/40 dark:via-zinc-600/40 to-transparent w-16" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
