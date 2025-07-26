'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';

const MESSAGE_LIMIT_COOKIE = 'boltX_message_limit';
const MESSAGE_USED_COOKIE = 'boltX_message_used';
const MESSAGE_DATE_COOKIE = 'boltX_message_date';
const MESSAGE_LAST_SYNC_COOKIE = 'boltX_last_sync';

interface MessageLimitContextType {
  messagesUsed: number;
  messagesLimit: number;
  remaining: number;
  isGuest: boolean;
  isRegular: boolean;
  incrementMessageCount: () => void;
  resetForNewDay: () => void;
  isLoading: boolean;
  hasReachedLimit: boolean;
  refreshUsage: () => Promise<void>;
}

const MessageLimitContext = createContext<MessageLimitContextType | null>(null);

export function MessageLimitProvider({
  children,
}: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isGuest = session?.user?.type === 'guest';
  const isRegular = session?.user?.type === 'regular';

  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(isGuest ? 20 : 50);
  const [isLoading, setIsLoading] = useState(true);

  // Get default limit based on user type
  const getDefaultLimit = useCallback(() => {
    if (isGuest) return 20;
    if (isRegular) return 50;
    return 20; // fallback
  }, [isGuest, isRegular]);

  // Check if it's a new day
  const isNewDay = useCallback(() => {
    const today = new Date().toDateString();
    const lastDate = Cookies.get(MESSAGE_DATE_COOKIE);
    return lastDate !== today;
  }, []);

  // Fetch from API with retry logic
  const fetchFromAPI = useCallback(
    async (retryCount = 0): Promise<{ limit: number; used: number } | null> => {
      try {
        const response = await fetch('/api/profile/tokens', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            limit: data.messagesLimit ?? getDefaultLimit(),
            used: data.tokensUsed ?? 0,
          };
        }

        // Retry on server errors
        if (response.status >= 500 && retryCount < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1)),
          );
          return fetchFromAPI(retryCount + 1);
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
        // Retry on network errors
        if (retryCount < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1)),
          );
          return fetchFromAPI(retryCount + 1);
        }
      }
      return null;
    },
    [getDefaultLimit],
  );

  // Load from cookies with validation
  const loadFromCookies = useCallback(() => {
    try {
      const limitCookie = Cookies.get(MESSAGE_LIMIT_COOKIE);
      const usedCookie = Cookies.get(MESSAGE_USED_COOKIE);
      const dateCookie = Cookies.get(MESSAGE_DATE_COOKIE);

      const today = new Date().toDateString();

      if (limitCookie && usedCookie && dateCookie === today) {
        const limit = Number.parseInt(limitCookie, 10);
        const used = Number.parseInt(usedCookie, 10);

        if (!Number.isNaN(limit) && !Number.isNaN(used) && used >= 0) {
          return { limit, used };
        }
      }
    } catch (error) {
      console.error('Error loading from cookies:', error);
    }
    return null;
  }, []);

  // Save to cookies with better error handling
  const saveToCookies = useCallback((limit: number, used: number) => {
    try {
      const today = new Date().toDateString();
      const lastSync = new Date().toISOString();

      Cookies.set(MESSAGE_LIMIT_COOKIE, limit.toString(), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set(MESSAGE_USED_COOKIE, used.toString(), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set(MESSAGE_DATE_COOKIE, today, {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set(MESSAGE_LAST_SYNC_COOKIE, lastSync, {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } catch (error) {
      console.error('Error saving to cookies:', error);
    }
  }, []);

  // Refresh usage from API with optimistic updates
  const refreshUsage = useCallback(async () => {
    const apiData = await fetchFromAPI();
    if (apiData) {
      setMessagesUsed(apiData.used);
      setMessagesLimit(apiData.limit);
      saveToCookies(apiData.limit, apiData.used);
    }
  }, [fetchFromAPI, saveToCookies]);

  // Initialize with better logic
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      try {
        // For logged-in users, always try API first
        if (session?.user?.id) {
          const apiData = await fetchFromAPI();
          if (apiData) {
            setMessagesUsed(apiData.used);
            setMessagesLimit(apiData.limit);
            saveToCookies(apiData.limit, apiData.used);
          } else {
            // Fallback to cookies for logged-in users
            const cookieData = loadFromCookies();
            if (cookieData) {
              setMessagesUsed(cookieData.used);
              setMessagesLimit(cookieData.limit);
            } else {
              // Final fallback to defaults
              const defaultLimit = getDefaultLimit();
              setMessagesUsed(0);
              setMessagesLimit(defaultLimit);
              saveToCookies(defaultLimit, 0);
            }
          }
        } else {
          // For guests, check if it's a new day first
          if (isNewDay()) {
            // Reset for new day
            const defaultLimit = getDefaultLimit();
            setMessagesUsed(0);
            setMessagesLimit(defaultLimit);
            saveToCookies(defaultLimit, 0);
          } else {
            // Load from cookies
            const cookieData = loadFromCookies();
            if (cookieData) {
              setMessagesUsed(cookieData.used);
              setMessagesLimit(cookieData.limit);
            } else {
              // Fallback to defaults
              const defaultLimit = getDefaultLimit();
              setMessagesUsed(0);
              setMessagesLimit(defaultLimit);
              saveToCookies(defaultLimit, 0);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing message limit:', error);
        // Final fallback
        const defaultLimit = getDefaultLimit();
        setMessagesUsed(0);
        setMessagesLimit(defaultLimit);
        saveToCookies(defaultLimit, 0);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if we have session data or are guest
    if (session?.user?.id || isGuest) {
      initialize();
    }
  }, [
    session?.user?.id,
    isGuest,
    loadFromCookies,
    fetchFromAPI,
    saveToCookies,
    getDefaultLimit,
    isNewDay,
  ]);

  // Update limit when user type changes
  useEffect(() => {
    const defaultLimit = getDefaultLimit();
    setMessagesLimit(defaultLimit);
    saveToCookies(defaultLimit, messagesUsed);
  }, [isGuest, isRegular, getDefaultLimit, messagesUsed, saveToCookies]);

  // Periodic sync for logged-in users
  useEffect(() => {
    if (!session?.user?.id) return;

    const syncInterval = setInterval(async () => {
      try {
        await refreshUsage();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [session?.user?.id, refreshUsage]);

  const incrementMessageCount = useCallback(() => {
    setMessagesUsed((prev) => {
      const newUsed = prev + 1;
      saveToCookies(messagesLimit, newUsed);

      // For logged-in users, sync with API in background
      if (session?.user?.id) {
        fetch('/api/profile/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increment: true }),
        }).catch((error) => {
          console.error('Failed to sync message count:', error);
        });
      }

      return newUsed;
    });
  }, [messagesLimit, saveToCookies, session?.user?.id]);

  const resetForNewDay = useCallback(() => {
    const defaultLimit = getDefaultLimit();
    setMessagesUsed(0);
    setMessagesLimit(defaultLimit);
    saveToCookies(defaultLimit, 0);
  }, [getDefaultLimit, saveToCookies]);

  const value = {
    messagesUsed,
    messagesLimit,
    remaining: Math.max(0, messagesLimit - messagesUsed),
    isGuest,
    isRegular,
    incrementMessageCount,
    resetForNewDay,
    isLoading,
    hasReachedLimit: messagesLimit - messagesUsed <= 0,
    refreshUsage,
  };

  return (
    <MessageLimitContext.Provider value={value}>
      {children}
    </MessageLimitContext.Provider>
  );
}

export function useMessageLimit() {
  const context = useContext(MessageLimitContext);
  if (!context) {
    throw new Error('useMessageLimit must be used within MessageLimitProvider');
  }
  return context;
}
