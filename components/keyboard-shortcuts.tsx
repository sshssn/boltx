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
  onToggleShortcutsOverlay?: () => void;
}

export function KeyboardShortcuts({
  onNewChat,
  onSearch,
  onToggleTheme,
  onCopyLastMessage,
  onRegenerate,
  onStopGeneration,
  onShowShortcuts,
  onToggleShortcutsOverlay,
}: KeyboardShortcutsProps) {
  const router = useRouter();

  // Try to use sidebar if available, otherwise provide a fallback
  let toggleSidebar: (() => void) | undefined;
  try {
    const { toggleSidebar: sidebarToggle } = useSidebar();
    toggleSidebar = sidebarToggle;
  } catch (error) {
    // Sidebar not available, provide a no-op function
    toggleSidebar = () => {
      console.log('Sidebar not available - toggle ignored');
    };
  }

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

      // Helper function to check for CMD or CTRL (either one)
      const isCmdOrCtrl = (event: KeyboardEvent) => {
        return event.metaKey || event.ctrlKey;
      };

      // Helper function to check for SHIFT+CMD/CTRL
      const isShiftCmdOrCtrl = (event: KeyboardEvent) => {
        return event.shiftKey && (event.metaKey || event.ctrlKey);
      };

      // ⌘K: Search chats
      if (isCmdOrCtrl(event) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onSearch?.();
        console.log('Shortcut triggered: Search chats (⌘K)');
        return;
      }

      // ⇧⌘O: Open new chat
      if (isShiftCmdOrCtrl(event) && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        onNewChat?.();
        console.log('Shortcut triggered: Open new chat (⇧⌘O)');
        return;
      }

      // ⇧⌘S: Toggle sidebar
      if (isShiftCmdOrCtrl(event) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        toggleSidebar();
        console.log('Shortcut triggered: Toggle sidebar (⇧⌘S)');
        return;
      }

      // ⇧⌘;: Copy last code block
      if (isShiftCmdOrCtrl(event) && event.key === ';') {
        event.preventDefault();
        onCopyLastMessage?.();
        console.log('Shortcut triggered: Copy last code block (⇧⌘;)');
        return;
      }

      // ⇧↓: Next message
      if (event.shiftKey && event.key === 'ArrowDown') {
        event.preventDefault();
        // TODO: Implement next message navigation
        console.log('Shortcut triggered: Next message (⇧↓)');
        return;
      }

      // ⇧↑: Previous message
      if (event.shiftKey && event.key === 'ArrowUp') {
        event.preventDefault();
        // TODO: Implement previous message navigation
        console.log('Shortcut triggered: Previous message (⇧↑)');
        return;
      }

      // ⇧⌘⌫: Delete chat
      if (isShiftCmdOrCtrl(event) && event.key === 'Backspace') {
        event.preventDefault();
        // TODO: Implement delete chat
        console.log('Shortcut triggered: Delete chat (⇧⌘⌫)');
        return;
      }

      // ⇧↻: Focus chat input
      if (event.shiftKey && event.key === 'r') {
        event.preventDefault();
        onSearch?.();
        console.log('Shortcut triggered: Focus chat input (⇧R)');
        return;
      }

      // ⌘/: Show shortcuts
      if (isCmdOrCtrl(event) && event.key === '/') {
        event.preventDefault();
        console.log(
          'Shortcut triggered: Show shortcuts (⌘/) - calling onToggleShortcutsOverlay',
        );
        onToggleShortcutsOverlay?.();
        return;
      }

      // ⇧⌘I: Set custom instructions
      if (isShiftCmdOrCtrl(event) && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        // TODO: Implement custom instructions
        console.log('Shortcut triggered: Set custom instructions (⇧⌘I)');
        return;
      }

      // Single key shortcuts (no modifiers)

      // Escape: Close modals, clear selection, etc.
      if (event.key === 'Escape') {
        event.preventDefault();

        // Close any open dialogs
        const openDialogs = document.querySelectorAll('[data-state="open"]');
        openDialogs.forEach((dialog) => {
          // Try to find close button
          const closeButton =
            dialog.querySelector('[data-dismiss]') ||
            dialog.querySelector('[aria-label*="close"]') ||
            dialog.querySelector('[role="button"][aria-label*="Close"]');

          if (closeButton && closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });

        // Close any open dropdowns
        const openDropdowns = document.querySelectorAll(
          '[data-radix-popper-content-wrapper]',
        );
        openDropdowns.forEach((dropdown) => {
          if (dropdown.getAttribute('data-state') === 'open') {
            // Trigger escape on the dropdown
            dropdown.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Escape' }),
            );
          }
        });

        console.log('Shortcut triggered: Escape (Close modals/dropdowns)');
        return;
      }

      // Fallback shortcuts for compatibility

      // CMD/CTRL+N: New Chat (fallback)
      if (isCmdOrCtrl(event) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onNewChat?.();
        console.log('Shortcut triggered: New Chat (CMD/CTRL+N - fallback)');
        return;
      }

      // CMD/CTRL+B: Toggle Sidebar (fallback)
      if (isCmdOrCtrl(event) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
        console.log(
          'Shortcut triggered: Toggle Sidebar (CMD/CTRL+B - fallback)',
        );
        return;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onNewChat,
    onSearch,
    onToggleTheme,
    onCopyLastMessage,
    onRegenerate,
    onStopGeneration,
    onShowShortcuts,
    onToggleShortcutsOverlay,
    toggleSidebar,
    router,
  ]);

  // This component doesn't render anything
  return null;
}
