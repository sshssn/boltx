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
const MESSAGE_INIT_COOKIE = 'boltX_initialized';

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
  forceSync: () => Promise<void>;
}

const MessageLimitContext = createContext<MessageLimitContextType | null>(null);

export function MessageLimitProvider({
  children,
}: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = session?.user?.type === 'guest';
  const isRegular = session?.user?.type === 'regular';

  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messagesLimit, setMessagesLimit] = useState(isGuest ? 20 : 50);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

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

  // Enhanced API fetch with better error handling and retries
  const fetchFromAPI = useCallback(
    async (retryCount = 0): Promise<{ limit: number; used: number } | null> => {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const response = await fetch(`/api/profile/tokens?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = {
            limit: data.messagesLimit ?? getDefaultLimit(),
            used: data.tokensUsed ?? 0,
          };
          
          // Update last sync time
          setLastSyncTime(Date.now());
          
          return result;
        }

        // Handle specific error codes
        if (response.status === 429) {
          console.warn('Rate limited while fetching token data');
          return null;
        }

        // Retry on server errors
        if (response.status >= 500 && retryCount < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)),
          );
          return fetchFromAPI(retryCount + 1);
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
        // Retry on network errors
        if (retryCount < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)),
          );
          return fetchFromAPI(retryCount + 1);
        }
      }
      return null;
    },
    [getDefaultLimit],
  );

  // Enhanced cookie loading with validation
  const loadFromCookies = useCallback(() => {
    try {
      const limitCookie = Cookies.get(MESSAGE_LIMIT_COOKIE);
      const usedCookie = Cookies.get(MESSAGE_USED_COOKIE);
      const dateCookie = Cookies.get(MESSAGE_DATE_COOKIE);
      const initCookie = Cookies.get(MESSAGE_INIT_COOKIE);

      const today = new Date().toDateString();

      // Only use cookies if they're from today and we've been initialized
      if (limitCookie && usedCookie && dateCookie === today && initCookie) {
        const limit = Number.parseInt(limitCookie, 10);
        const used = Number.parseInt(usedCookie, 10);

        if (!Number.isNaN(limit) && !Number.isNaN(used) && used >= 0 && limit > 0) {
          return { limit, used };
        }
      }
    } catch (error) {
      console.error('Error loading from cookies:', error);
    }
    return null;
  }, []);

  // Enhanced cookie saving
  const saveToCookies = useCallback((limit: number, used: number, markInitialized = true) => {
    try {
      const today = new Date().toDateString();
      const lastSync = new Date().toISOString();

      const cookieOptions = {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
      };

      Cookies.set(MESSAGE_LIMIT_COOKIE, limit.toString(), cookieOptions);
      Cookies.set(MESSAGE_USED_COOKIE, used.toString(), cookieOptions);
      Cookies.set(MESSAGE_DATE_COOKIE, today, cookieOptions);
      Cookies.set(MESSAGE_LAST_SYNC_COOKIE, lastSync, cookieOptions);
      
      if (markInitialized) {
        Cookies.set(MESSAGE_INIT_COOKIE, 'true', cookieOptions);
      }
    } catch (error) {
      console.error('Error saving to cookies:', error);
    }
  }, []);

  // Force sync with server (for external calls)
  const forceSync = useCallback(async () => {
    if (session?.user?.id) {
      const apiData = await fetchFromAPI();
      if (apiData) {
        setMessagesUsed(apiData.used);
        setMessagesLimit(apiData.limit);
        saveToCookies(apiData.limit, apiData.used);
        return;
      }
    }
    
    // Fallback for guests or failed API calls
    const cookieData = loadFromCookies();
    if (cookieData && !isNewDay()) {
      setMessagesUsed(cookieData.used);
      setMessagesLimit(cookieData.limit);
    } else {
      // Reset for new day or no valid data
      const defaultLimit = getDefaultLimit();
      setMessagesUsed(0);
      setMessagesLimit(defaultLimit);
      saveToCookies(defaultLimit, 0);
    }
  }, [session?.user?.id, fetchFromAPI, saveToCookies, loadFromCookies, isNewDay, getDefaultLimit]);

  // Refresh usage from API with optimistic updates
  const refreshUsage = useCallback(async () => {
    const apiData = await fetchFromAPI();
    if (apiData) {
      setMessagesUsed(apiData.used);
      setMessagesLimit(apiData.limit);
      saveToCookies(apiData.limit, apiData.used);
      
      // Emit event to notify other components
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('tokenUsageUpdate', {
          detail: { used: apiData.used, limit: apiData.limit }
        }));
      }
    }
  }, [fetchFromAPI, saveToCookies]);

  // Enhanced initialization with better fallback logic
  useEffect(() => {
    const initialize = async () => {
      // Don't initialize until we have session status
      if (sessionStatus === 'loading') {
        return;
      }

      setIsLoading(true);

      try {
        // Check for new day first
        if (isNewDay()) {
          console.log('New day detected, resetting counters');
          const defaultLimit = getDefaultLimit();
          setMessagesUsed(0);
          setMessagesLimit(defaultLimit);
          saveToCookies(defaultLimit, 0);
          setIsLoading(false);
          return;
        }

        // For logged-in users, prioritize server data
        if (session?.user?.id) {
          console.log('Initializing for logged-in user:', session.user.id);
          const apiData = await fetchFromAPI();
          if (apiData) {
            console.log('Got API data:', apiData);
            setMessagesUsed(apiData.used);
            setMessagesLimit(apiData.limit);
            saveToCookies(apiData.limit, apiData.used);
          } else {
            // Fallback to cookies for logged-in users
            console.log('API failed, falling back to cookies');
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
          // For guests, use cookies if available and valid
          console.log('Initializing for guest user');
          const cookieData = loadFromCookies();
          if (cookieData) {
            console.log('Using cookie data:', cookieData);
            setMessagesUsed(cookieData.used);
            setMessagesLimit(cookieData.limit);
          } else {
            // Fallback to defaults for guests
            console.log('No valid cookie data, using defaults');
            const defaultLimit = getDefaultLimit();
            setMessagesUsed(0);
            setMessagesLimit(defaultLimit);
            saveToCookies(defaultLimit, 0);
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

    initialize();
  }, [
    sessionStatus,
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
    if (!isLoading && sessionStatus !== 'loading') {
      const defaultLimit = getDefaultLimit();
      setMessagesLimit(defaultLimit);
      saveToCookies(defaultLimit, messagesUsed, false); // Don't mark as initialized on type change
    }
  }, [isGuest, isRegular, getDefaultLimit, messagesUsed, saveToCookies, isLoading, sessionStatus]);

  // Enhanced periodic sync for logged-in users
  useEffect(() => {
    if (!session?.user?.id || isLoading) return;

    const syncInterval = setInterval(async () => {
      try {
        // Only sync if it's been more than 10 seconds since last sync
        if (Date.now() - lastSyncTime > 10000) {
          await refreshUsage();
        }
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [session?.user?.id, refreshUsage, lastSyncTime, isLoading]);

  // Enhanced message count increment with better server sync
  const incrementMessageCount = useCallback(() => {
    setMessagesUsed((prev) => {
      const newUsed = prev + 1;
      saveToCookies(messagesLimit, newUsed, false);

      // Emit event to notify other components
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('tokenUsageUpdate', {
          detail: { used: newUsed, limit: messagesLimit }
        }));
      }

      // For logged-in users, sync with API in background
      if (session?.user?.id) {
        fetch('/api/profile/tokens', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ increment: true }),
        })
        .then(response => {
          if (response.ok) {
            setLastSyncTime(Date.now());
          }
        })
        .catch((error) => {
          console.error('Failed to sync message count:', error);
          // Retry once after a delay
          setTimeout(() => {
            fetch('/api/profile/tokens', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              },
              body: JSON.stringify({ increment: true }),
            }).catch(console.error);
          }, 2000);
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
    forceSync,
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
