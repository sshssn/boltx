import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { guestRegex } from '@/lib/constants';

export function useUsername() {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is a guest
    const isGuest = session?.user?.email
      ? guestRegex.test(session.user.email)
      : false;

    // If user is a guest, don't show any username
    if (isGuest) {
      setUsername(null);
      return;
    }

    // If we have a username in the session, use it
    if (session?.user?.username) {
      setUsername(session.user.username);
      return;
    }

    // If we have a session but no username, fetch it from the API
    if (session?.user?.id && !session.user.username) {
      setIsLoading(true);
      fetch('/api/profile/username')
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          // Don't throw error for 404 (user not found) or 401 (not authenticated)
          if (res.status === 404 || res.status === 401) {
            return null;
          }
          throw new Error(`Failed to fetch username: ${res.status}`);
        })
        .then((data) => {
          if (data?.username) {
            setUsername(data.username);
          } else {
            // Fallback to name or email
            setUsername(
              session.user.name?.split(' ')[0] ||
                session.user.email?.split('@')[0] ||
                'User',
            );
          }
        })
        .catch((error) => {
          console.error('Failed to fetch username:', error);
          // Fallback to name or email
          setUsername(
            session.user.name?.split(' ')[0] ||
              session.user.email?.split('@')[0] ||
              'User',
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (session?.user?.name) {
      // Fallback to name
      setUsername(session.user.name.split(' ')[0]);
    } else if (session?.user?.email) {
      // Fallback to email
      setUsername(session.user.email.split('@')[0]);
    } else {
      setUsername(null);
    }
  }, [session]);

  return { username, isLoading };
}
