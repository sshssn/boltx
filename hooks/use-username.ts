import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function useUsername() {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
          throw new Error('Failed to fetch username');
        })
        .then((data) => {
          setUsername(data.username);
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
