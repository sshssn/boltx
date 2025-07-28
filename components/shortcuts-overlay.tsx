'use client';

import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShortcutItem {
  label: string;
  shortcut: string;
  description?: string;
}

const shortcuts: ShortcutItem[] = [
  {
    label: 'New Thread',
    shortcut: '⌘ N',
    description: 'Start a new conversation',
  },
  {
    label: 'Focus Input',
    shortcut: '⌘ K',
    description: 'Focus the message input',
  },
  {
    label: 'Toggle Sidebar',
    shortcut: '⌘ B',
    description: 'Show/hide the sidebar',
  },
  {
    label: 'Toggle Theme',
    shortcut: '⌘ J',
    description: 'Switch between light/dark mode',
  },
  {
    label: 'Copy Last Message',
    shortcut: '⌘ C',
    description: 'Copy the last AI response',
  },
  {
    label: 'Regenerate Response',
    shortcut: '⌘ R',
    description: 'Regenerate the last AI response',
  },
  {
    label: 'Stop Generation',
    shortcut: '⌘ S',
    description: 'Stop the current AI response',
  },
  {
    label: 'Show Shortcuts',
    shortcut: '⌘ ?',
    description: 'Show this shortcuts panel',
  },
  {
    label: 'Close Overlay',
    shortcut: 'Esc',
    description: 'Close this shortcuts panel',
  },
];

interface ShortcutsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({
  isVisible,
  onClose,
}: ShortcutsOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Frost Glass Container */}
      <div
        className={`
          relative w-80 max-h-96 bg-white/80 dark:bg-zinc-900/80 
          backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 
          rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onAnimationEnd={() => setIsAnimating(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-zinc-700/30">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-white/20 dark:hover:bg-zinc-800/50"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {shortcuts.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between group hover:bg-white/20 dark:hover:bg-zinc-800/30 rounded-lg p-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.label}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="ml-2 text-xs font-mono bg-white/50 dark:bg-zinc-800/50 border-white/30 dark:border-zinc-700/30"
                >
                  {item.shortcut}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/20 dark:border-zinc-700/30 bg-white/20 dark:bg-zinc-800/20">
          <p className="text-xs text-center text-zinc-600 dark:text-zinc-400">
            Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-white/50 dark:bg-zinc-800/50 border border-white/30 dark:border-zinc-700/30 rounded">
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
