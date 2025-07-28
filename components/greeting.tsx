import { useUsername } from '@/hooks/use-username';

export const Greeting = () => {
  const { username, isLoading } = useUsername();
  const isLoggedIn = !!username;

  return (
    <h2 className="text-3xl font-semibold mb-4">
      {isLoggedIn ? (
        <>
          How can I help you,{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-indigo-600 bg-clip-text text-transparent">
            {username}
          </span>
          ?
        </>
      ) : (
        'How can I help you?'
      )}
    </h2>
  );
};
