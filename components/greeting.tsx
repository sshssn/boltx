import { useUsername } from '@/hooks/use-username';
import { useSession } from 'next-auth/react';

export const Greeting = () => {
  const { username, isLoading } = useUsername();
  const { data: session } = useSession();
  const isLoggedIn = !!username;
  const isAdmin = session?.user?.type === 'admin';

  return (
    <h2 className="text-3xl font-semibold mb-4">
      {isLoggedIn ? (
        <>
          How can I help you,{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-indigo-600 bg-clip-text text-transparent">
            {isAdmin ? 'Admin' : username}
          </span>
          ?
        </>
      ) : (
        'How can I help you?'
      )}
    </h2>
  );
};
