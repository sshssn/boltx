'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Keyboard,
  Search,
  Plus,
  Copy,
  RotateCcw,
  Sidebar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon components
const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronUp = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const Settings = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

interface ShortcutsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'General',
    items: [
      {
        label: 'Search chats',
        shortcut: '⌘K',
        icon: <Search className="size-3" />,
      },
      {
        label: 'Open new chat',
        shortcut: '⇧⌘O',
        icon: <Plus className="size-3" />,
      },
      {
        label: 'Toggle sidebar',
        shortcut: '⇧⌘S',
        icon: <Sidebar className="size-3" />,
      },
    ],
  },
  {
    category: 'Chat',
    items: [
      {
        label: 'Copy last code block',
        shortcut: '⇧⌘;',
        icon: <Copy className="size-3" />,
      },
      {
        label: 'Next message',
        shortcut: '⇧↓',
        icon: <ChevronDown className="size-3" />,
      },
      {
        label: 'Previous message',
        shortcut: '⇧↑',
        icon: <ChevronUp className="size-3" />,
      },
      {
        label: 'Delete chat',
        shortcut: '⇧⌘⌫',
        icon: <Trash2 className="size-3" />,
      },
      {
        label: 'Focus chat input',
        shortcut: '⇧↻',
        icon: <RotateCcw className="size-3" />,
      },
    ],
  },
  {
    category: 'Settings',
    items: [
      {
        label: 'Show shortcuts',
        shortcut: '⌘/',
        icon: <Keyboard className="size-3" />,
      },
      {
        label: 'Set custom instructions',
        shortcut: '⇧⌘I',
        icon: <Settings className="size-3" />,
      },
    ],
  },
];

export function ShortcutsOverlay({
  isVisible,
  onClose,
}: ShortcutsOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 z-50"
        >
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl backdrop-saturate-150 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 max-w-sm w-80">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200/60 dark:border-zinc-700/60">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
                  Keyboard shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {shortcuts.map((category) => (
                <div key={category.category} className="space-y-2">
                  <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-zinc-400 dark:text-zinc-500">
                            {item.icon}
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {item.label}
                          </span>
                        </div>
                        <kbd className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                          {item.shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-b-xl">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Press{' '}
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded border">
                  ⌘/
                </kbd>{' '}
                or{' '}
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded border">
                  Esc
                </kbd>{' '}
                to close
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
