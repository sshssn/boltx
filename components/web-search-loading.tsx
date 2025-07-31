'use client';

import { Search, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WebSearchLoading() {
  const [currentWord, setCurrentWord] = useState(0);
  const words = ['Searching', 'the', 'web', '...'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Globe className="size-4 text-blue-600 dark:text-white animate-spin" />
        <Search className="size-2.5 text-blue-500 dark:text-white/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="flex gap-1">
        {words.map((word, index) => (
          <span
            key={word}
            className={`text-sm font-medium transition-all duration-300 ${
              index === currentWord
                ? 'text-blue-600 dark:text-white scale-110'
                : 'text-blue-500/60 dark:text-white/60 scale-100'
            }`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
