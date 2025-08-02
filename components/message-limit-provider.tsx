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
  const isGuest = !session?.user?.id; // Consider user guest if no session
  const isRegular = session?.user?.role === 'client';
  const isAdmin = session?.user?.role === 'admin';

  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(10); // Default guest limit from entitlements
  const [isLoading, setIsLoading] = useState(true);

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

  // Load from cookies with validation and anti-tampering check
  const loadFromCookies = useCallback(() => {
    try {
      const limitCookie = Cookies.get(MESSAGE_LIMIT_COOKIE);
      const usedCookie = Cookies.get(MESSAGE_USED_COOKIE);
      const dateCookie = Cookies.get(MESSAGE_DATE_COOKIE);
      const hashCookie = Cookies.get('boltX_message_hash');

      const today = new Date().toDateString();

      if (limitCookie && usedCookie && dateCookie === today) {
        const limit = Number.parseInt(limitCookie, 10);
        const used = Number.parseInt(usedCookie, 10);

        if (!Number.isNaN(limit) && !Number.isNaN(used) && used >= 0) {
          // Validate hash to prevent tampering
          const expectedHash = btoa(`${limit}-${used}-${today}`).slice(0, 8);
          if (hashCookie === expectedHash) {
            return { limit, used };
          } else {
            console.warn(
              'Message limit cookie hash mismatch - possible tampering detected',
            );
            // Clear tampered cookies
            Cookies.remove(MESSAGE_LIMIT_COOKIE);
            Cookies.remove(MESSAGE_USED_COOKIE);
            Cookies.remove(MESSAGE_DATE_COOKIE);
            Cookies.remove('boltX_message_hash');
          }
        }
      }
    } catch (error) {
      console.error('Error loading from cookies:', error);
    }
    return null;
  }, []);

  // Save to cookies with better error handling and anti-tampering
  const saveToCookies = useCallback((limit: number, used: number) => {
    try {
      const today = new Date().toDateString();
      const lastSync = new Date().toISOString();

      // Add hash to prevent tampering
      const hash = btoa(`${limit}-${used}-${today}`).slice(0, 8);

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
      // Add integrity hash
      Cookies.set('boltX_message_hash', hash, {
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
        // Final fallback
        const defaultLimit = getDefaultLimit();
        setMessagesUsed(0);
        setMessagesLimit(defaultLimit);
        saveToCookies(defaultLimit, 0);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize for all users (both logged-in and guests)
    initialize();
  }, [
    loadFromCookies,
    fetchFromAPI,
    saveToCookies,
    getDefaultLimit,
    isNewDay,
    isGuest,
  ]);

  // Update limit when user type changes
  useEffect(() => {
    const defaultLimit = getDefaultLimit();
    setMessagesLimit(defaultLimit);
    saveToCookies(defaultLimit, messagesUsed);
  }, [isGuest, isRegular, getDefaultLimit, messagesUsed, saveToCookies]);

  // Periodic sync for all users - further reduced frequency
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        await refreshUsage();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 600000); // Sync every 10 minutes to further reduce API calls

    return () => clearInterval(syncInterval);
  }, [refreshUsage]);

  const incrementMessageCount = useCallback(() => {
    setMessagesUsed((prev) => {
      const newUsed = prev + 1;
      saveToCookies(messagesLimit, newUsed);

      // For guests, trigger usage display immediately after first message
      if (isGuest && prev === 0) {
        // Force a re-render to show usage counter
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('message-sent'));
        }, 50); // Reduced from 100ms to 50ms for faster response
      }

      // Only sync with API for logged-in users, and debounce the calls
      if (!isGuest) {
        // Debounce API calls to prevent spam - increased debounce time
        setTimeout(() => {
          fetch('/api/profile/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ increment: true }),
          }).catch((error) => {
            console.error('Failed to sync message count:', error);
          });
        }, 10000); // 10 second debounce to reduce API spam
      }

      return newUsed;
    });
  }, [messagesLimit, saveToCookies, isGuest]);

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
    hasReachedLimit: hasReachedLimit(),
    refreshUsage,
    // Add helper for rate limit message
    getRateLimitMessage: () => {
      const traceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return `You've reached your rate limit. Please try again later.\n\nIf the issue persists, contact support and provide the following:\nTrace ID: ${traceId}`;
    },
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
