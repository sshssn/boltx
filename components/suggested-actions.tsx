'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUsername } from '@/hooks/use-username';

// Type definitions
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface UseChatHelpers {
  sendMessage: (message: string) => void;
}

type VisibilityType = 'public' | 'private' | 'unlisted';

// Utility function to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Icon components - moved to top before usage
const PaintbrushIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="m7.07 14.94-1.13 1.13a3.984 3.984 0 0 1-5.657 0 3.984 3.984 0 0 1 0-5.657l1.13-1.13" />
    <path d="m12 15 3.5 3.5a2.121 2.121 0 0 1-3 3L9 18" />
  </svg>
);

const CompassIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
  </svg>
);

const TerminalIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="4,17 10,11 4,5" />
    <line x1="12" x2="20" y1="19" y2="19" />
  </svg>
);

const LightbulbIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 21h6" />
    <path d="M12 17c0 0 0-4.5 0-6a5 5 0 1 0-10 0c0 1.5 0 6 0 6 h10Z" />
    <path d="M12 1v2" />
    <path d="M22 12h-2" />
    <path d="M4 12H2" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="m6.34 6.34-1.41-1.41" />
  </svg>
);

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: (message: string) => void;
  selectedVisibilityType: VisibilityType;
  setInput?: (value: string) => void;
}

// Fun, engaging prompts for each category
const PRE_PROMPTS = {
  Create: [
    'Design a logo for a time travel agency',
    'Write a haiku about digital dreams',
    'Invent a superhero for the metaverse',
    'Create a tagline for invisible socks',
  ],
  Explore: [
    'Find a hidden gem city for 2025',
    'What hobby will be trending next year?',
    'Coolest underwater discovery recently?',
    'Most mind-blowing tech gadget under $50?',
  ],
  Code: [
    'One-liner to reverse a string in Python',
    'Best React pattern for state management?',
    'Debug: Why is my API call failing?',
    'Fastest way to deploy a simple app?',
  ],
  Learn: [
    'ELI5: How does quantum computing work?',
    'Latest breakthrough in renewable energy?',
    'Most exciting space discovery this year?',
    'What skill will be most valuable in 2030?',
  ],
};

// More unique and fun icons for each category
const CATEGORY_ICONS = {
  Create: <PaintbrushIcon size={20} />,
  Explore: <CompassIcon size={20} />,
  Code: <TerminalIcon size={20} />,
  Learn: <LightbulbIcon size={20} />,
};

const CATEGORY_COLORS = {
  Create: {
    active:
      'bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-fuchsia-500/30 border-purple-300/60 text-purple-800 dark:text-purple-200 shadow-purple-500/20',
    icon: 'text-purple-700 dark:text-purple-300',
    accent: 'bg-gradient-to-r from-purple-400/50 to-pink-400/50',
    frost: 'bg-purple-500/15 backdrop-blur-xl border-purple-300/40',
  },
  Explore: {
    active:
      'bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-sky-500/30 border-blue-300/60 text-blue-800 dark:text-blue-200 shadow-blue-500/20',
    icon: 'text-blue-700 dark:text-blue-300',
    accent: 'bg-gradient-to-r from-blue-400/50 to-cyan-400/50',
    frost: 'bg-blue-500/15 backdrop-blur-xl border-blue-300/40',
  },
  Code: {
    active:
      'bg-gradient-to-br from-emerald-500/30 via-green-500/20 to-teal-500/30 border-emerald-300/60 text-emerald-800 dark:text-emerald-200 shadow-emerald-500/20',
    icon: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-gradient-to-r from-emerald-400/50 to-teal-400/50',
    frost: 'bg-emerald-500/15 backdrop-blur-xl border-emerald-300/40',
  },
  Learn: {
    active:
      'bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-orange-500/30 border-amber-300/60 text-amber-800 dark:text-amber-200 shadow-amber-500/20',
    icon: 'text-amber-700 dark:text-amber-300',
    accent: 'bg-gradient-to-r from-amber-400/50 to-orange-400/50',
    frost: 'bg-amber-500/15 backdrop-blur-xl border-amber-300/40',
  },
};

// Dynamic greeting component (no loading animations)
function DynamicGreeting() {
  const [greeting, setGreeting] = useState('');
  const { data: session, status } = useSession();
  const { username } = useUsername();

  // Get username from session
  const displayUsername = username || session?.user?.name || 'there';

  useEffect(() => {
    if (!displayUsername || status === 'loading') return;

    // Time-based greeting
    const hour = new Date().getHours();
    let timeGreeting = '';

    if (hour < 5) timeGreeting = 'Working late';
    else if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else if (hour < 21) timeGreeting = 'Good evening';
    else timeGreeting = 'Good night';

    // Variety of greeting styles
    const greetingStyles = [
      `${timeGreeting}, ${displayUsername}!`,
      `Hey there, ${displayUsername}!`,
      `Welcome back, ${displayUsername}`,
      `Hi ${displayUsername}! Ready to explore?`,
      `${timeGreeting}! What's on your mind, ${displayUsername}?`,
      `Great to see you, ${displayUsername}!`,
    ];

    const randomGreeting =
      greetingStyles[Math.floor(Math.random() * greetingStyles.length)];
    setGreeting(randomGreeting);
  }, [displayUsername, status]);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
              Welcome back
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium">
            What would you like to explore today?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-bold">
          <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
            {greeting.split(displayUsername)[0]}
          </span>
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent font-extrabold">
            {displayUsername}
          </span>
          <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
            {greeting.split(displayUsername)[1]}
          </span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium">
          What would you like to explore today?
        </p>
      </div>
    </div>
  );
}

export function SuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  setInput,
}: SuggestedActionsProps) {
  const categoryKeys = Object.keys(PRE_PROMPTS) as (keyof typeof PRE_PROMPTS)[];
  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof PRE_PROMPTS | undefined
  >(undefined);
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  const promptsToShow = selectedCategory
    ? PRE_PROMPTS[selectedCategory]
    : PRE_PROMPTS[categoryKeys[0]];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 px-4 sm:px-8">
      {/* Dynamic Greeting */}
      <div>
        <DynamicGreeting />
      </div>

      {/* Modern Category Pills */}
      <div className="flex flex-row justify-center gap-3 text-sm">
        {categoryKeys.map((cat, index) => (
          <button
            key={cat}
            type="button"
            className={cn(
              'group relative overflow-hidden backdrop-blur-xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              'h-14 flex items-center gap-3 rounded-full px-8 py-4 font-semibold border-2',
              'transform hover:scale-105 active:scale-95',
              selectedCategory === cat
                ? `${CATEGORY_COLORS[cat].active} shadow-2xl scale-105`
                : 'bg-white/40 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-white/30 dark:border-zinc-700/50 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:border-white/50 dark:hover:border-zinc-600/60 backdrop-blur-xl hover:shadow-lg',
            )}
            onClick={() => setSelectedCategory(cat)}
          >
            {/* Animated background for selected */}
            {selectedCategory === cat && (
              <div
                className={cn(
                  'absolute inset-0 rounded-full',
                  CATEGORY_COLORS[cat].accent,
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'transition-all duration-300 z-10',
                selectedCategory === cat
                  ? CATEGORY_COLORS[cat].icon
                  : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
              )}
            >
              {CATEGORY_ICONS[cat]}
            </div>

            <span className="relative z-10 font-bold tracking-wider text-sm">
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Clean Prompt Texts - No Containers */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          {promptsToShow.map((prompt, idx) => (
            <div key={`${selectedCategory}-${prompt}`}>
              <button
                type="button"
                className="group w-full text-left px-8 py-6 transition-all duration-300 text-base font-medium hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-white/40"
                onClick={() => {
                  if (setInput) setInput(prompt);
                }}
                onMouseEnter={() => setHoveredPrompt(prompt)}
                onMouseLeave={() => setHoveredPrompt(null)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors duration-300 leading-relaxed font-medium text-lg">
                    {prompt}
                  </span>

                  <div className="ml-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                    <svg
                      className="size-5 text-zinc-500 dark:text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17L17 7M17 7H7M17 7V17"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Clean separator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-4">
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-300/60 dark:via-zinc-600/60 to-transparent w-20" />
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                CATEGORY_COLORS[selectedCategory ?? categoryKeys[0]].accent,
              )}
            />
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-300/60 dark:via-zinc-600/60 to-transparent w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
