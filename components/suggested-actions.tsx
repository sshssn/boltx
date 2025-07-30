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

// Clean, modern icon components
const CreateIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ExploreIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const CodeIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>
);

const LearnIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: (message: string) => void;
  selectedVisibilityType: VisibilityType;
  setInput?: (value: string) => void;
}

// Clean, focused prompts - 4 per category
const PRE_PROMPTS = {
  Create: [
    'Write a short story about a robot discovering emotions',
    'Help me outline a sci-fi novel set in a post-apocalyptic world',
    'Create a character profile for a complex villain with sympathetic motives',
    'Give me 5 creative writing prompts for flash fiction',
  ],
  Explore: [
    'What are the most Instagram-worthy hidden gems in Europe?',
    'What will replace smartphones in the next 10 years?',
    'What is the most breathtaking natural wonder discovered recently?',
    'Explain the latest mind-blowing space discovery simply',
  ],
  Code: [
    'Write a one-liner to sort an array by multiple properties',
    'What is the best React pattern for complex state management?',
    'How do I debug an API that returns 200 but empty data?',
    'What is the fastest way to deploy a Next.js app for free?',
  ],
  Learn: [
    'Explain how machine learning works in simple terms',
    'What is the latest breakthrough in clean energy technology?',
    'What is the most exciting space mission launching soon?',
    'What skill will be most valuable by 2030?',
  ],
};

// Clean category icons
const CATEGORY_ICONS = {
  Create: <CreateIcon size={18} />,
  Explore: <ExploreIcon size={18} />,
  Code: <CodeIcon size={18} />,
  Learn: <LearnIcon size={18} />,
};

// Enhanced color scheme with better hover effects
const CATEGORY_THEMES = {
  Create: {
    active:
      'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25',
    inactive:
      'bg-white/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white hover:shadow-md hover:shadow-zinc-500/20 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  Explore: {
    active:
      'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25',
    inactive:
      'bg-white/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white hover:shadow-md hover:shadow-zinc-500/20 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  Code: {
    active:
      'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25',
    inactive:
      'bg-white/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white hover:shadow-md hover:shadow-zinc-500/20 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  Learn: {
    active:
      'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25',
    inactive:
      'bg-white/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white hover:shadow-md hover:shadow-zinc-500/20 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
};

// Enhanced dynamic greeting with username logic
function DynamicGreeting() {
  const [greeting, setGreeting] = useState('');
  const { data: session, status } = useSession();
  const { username } = useUsername();

  const displayUsername = username || session?.user?.name;
  const isLoggedIn = !!displayUsername;

  useEffect(() => {
    if (status === 'loading') return;

    const hour = new Date().getHours();
    let timeGreeting = '';

    // Time-based greeting logic
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }

    if (isLoggedIn) {
      // Greetings for logged in users
      const greetingStyles = [
        `${timeGreeting}, ${displayUsername}!`,
        `Hey ${displayUsername}!`,
        `Welcome back, ${displayUsername}`,
        `Hi ${displayUsername}! Ready to create?`,
        `${timeGreeting}! What's inspiring you today?`,
        `Great to see you, ${displayUsername}!`,
      ];

      const randomGreeting =
        greetingStyles[Math.floor(Math.random() * greetingStyles.length)];
      setGreeting(randomGreeting);
    } else {
      // Simple greeting for logged out users
      const guestGreetings = [
        'How can I help you?',
        'Welcome! What would you like to explore?',
        'Ready to get started?',
        'What can I assist you with today?',
      ];

      const randomGreeting =
        guestGreetings[Math.floor(Math.random() * guestGreetings.length)];
      setGreeting(randomGreeting);
    }
  }, [displayUsername, status, isLoggedIn]);

  if (status === 'loading') {
    return (
      <motion.div
        className="text-left space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
          How can I help you?
        </h1>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="text-left space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          {isLoggedIn ? (
            <>
              <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-200 dark:via-zinc-100 dark:to-zinc-200 bg-clip-text text-transparent">
                {greeting.includes(displayUsername)
                  ? greeting.split(displayUsername)[0]
                  : greeting}
              </span>
              {greeting.includes(displayUsername) && (
                <>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent font-black">
                    {displayUsername}
                  </span>
                  <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 dark:from-zinc-200 dark:via-zinc-100 dark:to-zinc-200 bg-clip-text text-transparent">
                    {greeting.split(displayUsername)[1]}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-zinc-900 dark:text-white">{greeting}</span>
          )}
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium">
          {isLoggedIn
            ? 'What would you like to explore today?'
            : 'Choose a category to get started'}
        </p>
      </div>
    </motion.div>
  );
}

export function SuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  setInput,
}: SuggestedActionsProps) {
  const categoryKeys = Object.keys(PRE_PROMPTS) as (keyof typeof PRE_PROMPTS)[];
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof PRE_PROMPTS>('Create');

  const promptsToShow = selectedCategory
    ? PRE_PROMPTS[selectedCategory]
    : PRE_PROMPTS.Create;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      {/* Enhanced Greeting with Username */}
      <DynamicGreeting />

      {/* Category Selection - Horizontal buttons, left-aligned */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {categoryKeys.map((category, index) => {
          const theme = CATEGORY_THEMES[category];
          const isSelected = selectedCategory === category;

          return (
            <motion.button
              key={category}
              type="button"
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300',
                'border focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
                isSelected ? theme.active : theme.inactive,
              )}
              onClick={() => setSelectedCategory(category)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {CATEGORY_ICONS[category]}
              <span>{category}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Prompt List - Left-aligned, enhanced hover effects */}
      <motion.div
        className="space-y-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {promptsToShow.map((prompt, idx) => (
          <motion.div
            key={`${selectedCategory}-${prompt}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
          >
            <button
              type="button"
              className="w-full text-left p-4 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:shadow-lg hover:shadow-zinc-500/10 transition-all duration-300 focus:outline-none focus:bg-zinc-100/80 dark:focus:bg-zinc-800/60 focus:shadow-lg focus:shadow-zinc-500/10 rounded-lg"
              onClick={() => {
                if (setInput) setInput(prompt);
              }}
            >
              <p className="text-zinc-900 dark:text-white text-base leading-relaxed group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors duration-200">
                {prompt}
              </p>
            </button>
            {idx < promptsToShow.length - 1 && (
              <div className="h-px bg-zinc-300 dark:bg-zinc-700 mx-4" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
