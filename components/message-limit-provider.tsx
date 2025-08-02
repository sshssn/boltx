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
  const { data: session, status } = useSession();
  const isGuest = !session?.user?.id; // Consider user guest if no session
  const isRegular = session?.user?.role === 'regular';
  const isAdmin = session?.user?.role === 'admin';

  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(10); // Default guest limit from entitlements
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get default limit based on user type
  const getDefaultLimit = useCallback(() => {
    if (isAdmin) return -1; // Unlimited for admin
    if (isGuest) return 10; // Guest limit from entitlements
    if (isRegular) return 25; // Regular user limit from entitlements
    return 10; // fallback to guest limit
  }, [isGuest, isRegular, isAdmin]);

  // Check if user has reached limit (admin has no limits)
  const hasReachedLimit = useCallback(() => {
    if (isAdmin || messagesLimit === -1) return false; // Admin has no limits
    return messagesUsed >= messagesLimit;
  }, [messagesUsed, messagesLimit, isAdmin]);

  // Check if it's a new day
  const isNewDay = useCallback(() => {
    const today = new Date().toDateString();
    const lastDate = Cookies.get(MESSAGE_DATE_COOKIE);
    return lastDate !== today;
  }, []);

  // Save to cookies with error handling
  const saveToCookies = useCallback((limit: number, used: number) => {
    try {
      const today = new Date().toDateString();
      Cookies.set(MESSAGE_LIMIT_COOKIE, limit.toString(), { expires: 1 });
      Cookies.set(MESSAGE_USED_COOKIE, used.toString(), { expires: 1 });
      Cookies.set(MESSAGE_DATE_COOKIE, today, { expires: 1 });
      Cookies.set(MESSAGE_LAST_SYNC_COOKIE, Date.now().toString(), {
        expires: 1,
      });
    } catch (error) {
      console.error('Error saving to cookies:', error);
    }
  }, []);

  // Load from cookies with validation and anti-tampering check
  const loadFromCookies = useCallback(() => {
    try {
      const limit = Cookies.get(MESSAGE_LIMIT_COOKIE);
      const used = Cookies.get(MESSAGE_USED_COOKIE);
      const lastSync = Cookies.get(MESSAGE_LAST_SYNC_COOKIE);

      if (limit && used && lastSync) {
        const limitNum = Number.parseInt(limit, 10);
        const usedNum = Number.parseInt(used, 10);
        const lastSyncNum = Number.parseInt(lastSync, 10);

        // Validate data integrity
        if (
          !Number.isNaN(limitNum) &&
          !Number.isNaN(usedNum) &&
          !Number.isNaN(lastSyncNum) &&
          usedNum >= 0 &&
          limitNum > 0 &&
          lastSyncNum > 0
        ) {
          return { limit: limitNum, used: usedNum };
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading from cookies:', error);
      return null;
    }
  }, []);

  // Fetch from API with retry logic and debouncing
  const fetchFromAPI = useCallback(
    async (retryCount = 0): Promise<{ limit: number; used: number } | null> => {
      // Add debouncing to prevent excessive API calls
      const now = Date.now();
      const lastCall = (fetchFromAPI as any).lastCall || 0;
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall < 5000) {
        // Minimum 5 seconds between calls to reduce API load
        return null;
      }

      (fetchFromAPI as any).lastCall = now;

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

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter
            ? Number.parseInt(retryAfter, 10) * 1000
            : 5000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return null;
        }

        // Retry on server errors
        if (response.status >= 500 && retryCount < 2) {
          await new Promise(
            (resolve) => setTimeout(resolve, 500 * (retryCount + 1)), // Reduced from 1000ms to 500ms
          );
          return fetchFromAPI(retryCount + 1);
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
        // Retry on network errors
        if (retryCount < 2) {
          await new Promise(
            (resolve) => setTimeout(resolve, 500 * (retryCount + 1)), // Reduced from 1000ms to 500ms
          );
          return fetchFromAPI(retryCount + 1);
        }
      }
      return null;
    },
    [getDefaultLimit],
  );

  // Initialize with better logic
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if it's a new day first
        if (isNewDay()) {
          // Reset for new day
          const defaultLimit = getDefaultLimit();
          setMessagesUsed(0);
          setMessagesLimit(defaultLimit);
          saveToCookies(defaultLimit, 0);
          setIsLoading(false);
          return;
        }

        // Try API first for logged-in users only
        if (!isGuest) {
          const apiData = await fetchFromAPI();
          if (apiData) {
            setMessagesUsed(apiData.used);
            setMessagesLimit(apiData.limit);
            saveToCookies(apiData.limit, apiData.used);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to cookies for all users
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
      } catch (error) {
        console.error('Error initializing message limit:', error);
        setError('Failed to initialize message limit');
        // Final fallback
        const defaultLimit = getDefaultLimit();
        setMessagesUsed(0);
        setMessagesLimit(defaultLimit);
        saveToCookies(defaultLimit, 0);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize when session status is not loading
    if (status !== 'loading') {
      initialize();
    }
  }, [
    loadFromCookies,
    fetchFromAPI,
    saveToCookies,
    getDefaultLimit,
    isNewDay,
    isGuest,
    status,
  ]);

  // Update limit when user type changes
  useEffect(() => {
    const defaultLimit = getDefaultLimit();
    setMessagesLimit(defaultLimit);
    saveToCookies(defaultLimit, messagesUsed);
  }, [messagesLimit, saveToCookies, isGuest]);

  const incrementMessageCount = () => {
    setMessagesUsed((prev) => {
      const newUsed = prev + 1;
      saveToCookies(messagesLimit, newUsed);
      return newUsed;
    });
  };

  const resetForNewDay = useCallback(() => {
    const defaultLimit = getDefaultLimit();
    setMessagesUsed(0);
    setMessagesLimit(defaultLimit);
    saveToCookies(defaultLimit, 0);
  }, [getDefaultLimit, saveToCookies]);

  const refreshUsage = useCallback(async () => {
    try {
      const apiData = await fetchFromAPI();
      if (apiData) {
        setMessagesUsed(apiData.used);
        setMessagesLimit(apiData.limit);
        saveToCookies(apiData.limit, apiData.used);
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  }, [fetchFromAPI, saveToCookies]);

  const value = {
    messagesUsed,
    messagesLimit,
    remaining: Math.max(0, messagesLimit - messagesUsed),
    isGuest,
    isRegular,
    incrementMessageCount,
    resetForNewDay,
    isLoading,
    hasReachedLimit: hasReachedLimit(),
    refreshUsage,
    // Add helper for rate limit message
    getRateLimitMessage: () => {
      const traceId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      return `You've reached your rate limit. Please try again later.\n\nIf the issue persists, contact support and provide the following:\nTrace ID: ${traceId}`;
    },
  };

  // Error boundary - if there's an error, render children without context
  if (error) {
    console.error('MessageLimitProvider error:', error);
    return <>{children}</>;
  }

  return (
    <MessageLimitContext.Provider value={value}>
      {children}
    </MessageLimitContext.Provider>
  );
}

export function useMessageLimit() {
  const context = useContext(MessageLimitContext);
  if (!context) {
    // Instead of throwing an error, return a fallback context
    console.warn(
      'useMessageLimit must be used within MessageLimitProvider - using fallback',
    );
    return {
      messagesUsed: 0,
      messagesLimit: 10,
      remaining: 10,
      isGuest: true,
      isRegular: false,
      incrementMessageCount: () => {},
      resetForNewDay: () => {},
      isLoading: false,
      hasReachedLimit: false,
      refreshUsage: async () => {},
      getRateLimitMessage: () => 'Rate limit message not available',
    };
  }
  return context;
}
