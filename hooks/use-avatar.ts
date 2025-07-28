import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getAvatarUrlForComponent, hasGravatar } from '@/lib/gravatar';

export function useAvatar(size = 32) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setAvatarUrl(null);
      setHasCustomAvatar(false);
      return;
    }

    const email = session.user.email;
    const url = getAvatarUrlForComponent(email, size);
    setAvatarUrl(url);

    // Check if user has a custom Gravatar
    setIsLoading(true);
    hasGravatar(email)
      .then((hasCustom) => {
        setHasCustomAvatar(hasCustom);
      })
      .catch(() => {
        setHasCustomAvatar(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session?.user?.email, size]);

  return {
    avatarUrl,
    hasCustomAvatar,
    isLoading,
    email: session?.user?.email,
  };
}
