'use client';

import { useState } from 'react';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { ShortcutsOverlay } from './shortcuts-overlay';

export function GlobalShortcutsProvider({
  children,
}: { children: React.ReactNode }) {
  const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);

  const handleToggleShortcutsOverlay = () => {
    console.log('GlobalShortcutsProvider: Toggling shortcuts overlay', {
      current: showShortcutsOverlay,
    });
    setShowShortcutsOverlay(!showShortcutsOverlay);
  };

  return (
    <>
      <KeyboardShortcuts
        onToggleShortcutsOverlay={handleToggleShortcutsOverlay}
      />
      <ShortcutsOverlay
        isVisible={showShortcutsOverlay}
        onClose={() => setShowShortcutsOverlay(false)}
      />
      {children}
    </>
  );
}
