'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from './ui/sidebar';

interface KeyboardShortcutsProps {
  onNewChat?: () => void;
  onSearch?: () => void;
  onToggleTheme?: () => void;
  onCopyLastMessage?: () => void;
  onRegenerate?: () => void;
  onStopGeneration?: () => void;
  onShowShortcuts?: () => void;
}

export function KeyboardShortcuts({
  onNewChat,
  onSearch,
  onToggleTheme,
  onCopyLastMessage,
  onRegenerate,
  onStopGeneration,
  onShowShortcuts,
}: KeyboardShortcutsProps) {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).contentEditable === 'true'
      ) {
        return;
      }

      // Cmd/Ctrl + K: Focus Input
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onSearch?.();
      }

      // Cmd/Ctrl + N: New Thread
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        onNewChat?.();
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }

      // Cmd/Ctrl + J: Toggle Theme
      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault();
        onToggleTheme?.();
      }

      // Cmd/Ctrl + P: Previous Chat
      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        event.preventDefault();
        // TODO: Implement previous chat navigation
        console.log('Previous chat');
      }

      // Cmd/Ctrl + L: Next Chat
      if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
        event.preventDefault();
        // TODO: Implement next chat navigation
        console.log('Next chat');
      }

      // Cmd/Ctrl + ?: Show Shortcuts
      if ((event.metaKey || event.ctrlKey) && event.key === '?') {
        event.preventDefault();
        onShowShortcuts?.();
      }

      // Cmd/Ctrl + C: Copy last message
      if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
        event.preventDefault();
        onCopyLastMessage?.();
      }

      // Cmd/Ctrl + R: Regenerate response
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        onRegenerate?.();
      }

      // Cmd/Ctrl + S: Stop generation
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        onStopGeneration?.();
      }

      // Escape: Close modals, clear selection, etc.
      if (event.key === 'Escape') {
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('[data-state="open"]');
        modals.forEach((modal) => {
          const closeButton = modal.querySelector(
            '[data-radix-collection-item]',
          );
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    onNewChat,
    onSearch,
    onToggleTheme,
    onCopyLastMessage,
    onRegenerate,
    onStopGeneration,
    onShowShortcuts,
    toggleSidebar,
  ]);

  return null;
}
