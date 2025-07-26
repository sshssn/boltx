'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';

const MESSAGE_LIMIT_COOKIE = 'boltX_message_limit';
const MESSAGE_USED_COOKIE = 'boltX_message_used';
const MESSAGE_LIMIT_EXPIRY = 1; // 1 day

interface MessageLimitState {
  messagesUsed: number;
  messagesLimit: number;
  isLoading: boolean;
  error: string | null;
}

export function useMessageLimit() {
  const { data: session } = useSession();
  const isGuest = session?.user?.type === 'guest';
  const isRegular = session?.user?.type === 'regular';

  const [state, setState] = useState<MessageLimitState>({
    messagesUsed: 0,
    messagesLimit: isGuest ? 20 : 50,
    isLoading: true,
    error: null,
  });

  // Force update state when user type changes
  useEffect(() => {
    const defaultLimit = getDefaultLimit();
    setState((prev) => ({
      ...prev,
      messagesLimit: defaultLimit,
      isLoading: false,
    }));
  }, [isGuest, isRegular]);

  // Get default limit based on user type
  const getDefaultLimit = () => {
    if (isGuest) return 20;
    if (isRegular) return 50;
    return 20; // fallback
  };

  // Load from cookies first (for immediate response)
  const loadFromCookies = () => {
    try {
      const limitCookie = Cookies.get(MESSAGE_LIMIT_COOKIE);
      const usedCookie = Cookies.get(MESSAGE_USED_COOKIE);

      if (limitCookie && usedCookie) {
        const limit = Number.parseInt(limitCookie, 10);
        const used = Number.parseInt(usedCookie, 10);

        // Only use cookies if they're from today
        const cookieDate = Cookies.get('boltX_message_date');
        const today = new Date().toDateString();

        if (
          cookieDate === today &&
          !Number.isNaN(limit) &&
          !Number.isNaN(used)
        ) {
          return { limit, used };
        }
      }
    } catch (error) {
      console.error('Error loading from cookies:', error);
    }
    return null;
  };

  // Save to cookies
  const saveToCookies = (limit: number, used: number) => {
    try {
      const today = new Date().toDateString();
      Cookies.set(MESSAGE_LIMIT_COOKIE, limit.toString(), {
        expires: MESSAGE_LIMIT_EXPIRY,
      });
      Cookies.set(MESSAGE_USED_COOKIE, used.toString(), {
        expires: MESSAGE_LIMIT_EXPIRY,
      });
      Cookies.set('boltX_message_date', today, {
        expires: MESSAGE_LIMIT_EXPIRY,
      });
    } catch (error) {
      console.error('Error saving to cookies:', error);
    }
  };

  // Fetch from API
  const fetchFromAPI = async () => {
    try {
      const response = await fetch('/api/profile/tokens');
      if (response.ok) {
        const data = await response.json();
        const limit = data.messagesLimit ?? getDefaultLimit();
        const used = data.tokensUsed ?? 0;

        setState({
          messagesUsed: used,
          messagesLimit: limit,
          isLoading: false,
          error: null,
        });

        saveToCookies(limit, used);
        return { limit, used };
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
    return null;
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Load from cookies first for immediate response
      const cookieData = loadFromCookies();
      if (cookieData) {
        setState({
          messagesUsed: cookieData.used,
          messagesLimit: cookieData.limit,
          isLoading: false,
          error: null,
        });
      }

      // Then fetch from API to ensure accuracy
      const apiData = await fetchFromAPI();
      if (apiData) {
        setState({
          messagesUsed: apiData.used,
          messagesLimit: apiData.limit,
          isLoading: false,
          error: null,
        });
      } else {
        // Fallback to defaults
        const defaultLimit = getDefaultLimit();
        setState({
          messagesUsed: 0,
          messagesLimit: defaultLimit,
          isLoading: false,
          error: null,
        });
        saveToCookies(defaultLimit, 0);
      }
    };

    // Only initialize if we have session data
    if (session?.user?.id || isGuest) {
      initialize();
    }
  }, [isGuest, isRegular, session?.user?.id]);

  // Increment message count
  const incrementMessageCount = () => {
    setState((prev) => {
      const newUsed = prev.messagesUsed + 1;
      const currentLimit = prev.messagesLimit;
      saveToCookies(currentLimit, newUsed);

      // Also try to sync with API in background
      fetch('/api/profile/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment: true }),
      }).catch((error) => {
        console.error('Failed to sync message count:', error);
      });

      return { ...prev, messagesUsed: newUsed };
    });
  };

  // Reset for new day
  const resetForNewDay = () => {
    const defaultLimit = getDefaultLimit();
    setState({
      messagesUsed: 0,
      messagesLimit: defaultLimit,
      isLoading: false,
      error: null,
    });
    saveToCookies(defaultLimit, 0);
  };

  return {
    ...state,
    incrementMessageCount,
    resetForNewDay,
    isGuest,
    isRegular,
    remaining: Math.max(0, state.messagesLimit - state.messagesUsed),
    hasReachedLimit: state.messagesLimit - state.messagesUsed <= 0,
  };
}
