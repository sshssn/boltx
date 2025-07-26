'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ChatMessage } from '@/lib/types';

interface ChatCache {
  [chatId: string]: {
    messages: ChatMessage[];
    lastAccessed: number;
    isLoaded: boolean;
  };
}

interface ChatCacheContextType {
  getChat: (chatId: string) => ChatCache[string] | null;
  setChat: (chatId: string, messages: ChatMessage[]) => void;
  preloadChat: (chatId: string) => void;
  clearCache: () => void;
  isPreloading: (chatId: string) => boolean;
}

const ChatCacheContext = createContext<ChatCacheContextType | null>(null);

const CACHE_SIZE_LIMIT = 10; // Keep last 10 chats in memory
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<ChatCache>({});
  const [preloading, setPreloading] = useState<Set<string>>(new Set());

  // Clean up old cache entries
  const cleanupCache = useCallback(() => {
    setCache((prevCache) => {
      const now = Date.now();
      const entries = Object.entries(prevCache);

      // Remove expired entries
      const validEntries = entries.filter(
        ([_, data]) => now - data.lastAccessed < CACHE_EXPIRY,
      );

      // If still too many, remove oldest
      if (validEntries.length > CACHE_SIZE_LIMIT) {
        const sorted = validEntries.sort(
          (a, b) => a[1].lastAccessed - b[1].lastAccessed,
        );
        const toKeep = sorted.slice(-CACHE_SIZE_LIMIT);
        return Object.fromEntries(toKeep);
      } else {
        return Object.fromEntries(validEntries);
      }
    });
  }, []);

  // Cleanup on mount and every 5 minutes
  useEffect(() => {
    cleanupCache();
    const interval = setInterval(cleanupCache, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupCache]);

  const getChat = useCallback(
    (chatId: string) => {
      const chat = cache[chatId];
      if (chat) {
        // Update last accessed time
        setCache((prev) => ({
          ...prev,
          [chatId]: { ...chat, lastAccessed: Date.now() },
        }));
        return chat;
      }
      return null;
    },
    [cache],
  );

  const setChat = useCallback((chatId: string, messages: ChatMessage[]) => {
    setCache((prev) => ({
      ...prev,
      [chatId]: {
        messages,
        lastAccessed: Date.now(),
        isLoaded: true,
      },
    }));
  }, []);

  const preloadChat = useCallback(
    async (chatId: string) => {
      if (cache[chatId]?.isLoaded || preloading.has(chatId)) return;

      setPreloading((prev) => new Set(prev).add(chatId));

      try {
        // Preload chat data
        const response = await fetch(`/api/chat/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setChat(chatId, data.messages || []);
        }
      } catch (error) {
        console.error('Failed to preload chat:', error);
      } finally {
        setPreloading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          return newSet;
        });
      }
    },
    [cache, preloading, setChat],
  );

  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  const isPreloading = useCallback(
    (chatId: string) => {
      return preloading.has(chatId);
    },
    [preloading],
  );

  return (
    <ChatCacheContext.Provider
      value={{
        getChat,
        setChat,
        preloadChat,
        clearCache,
        isPreloading,
      }}
    >
      {children}
    </ChatCacheContext.Provider>
  );
}

export function useChatCache() {
  const context = useContext(ChatCacheContext);
  if (!context) {
    throw new Error('useChatCache must be used within ChatCacheProvider');
  }
  return context;
}
