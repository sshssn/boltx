import { useSession } from 'next-auth/react';

export const Greeting = () => {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || '';
  const isLoggedIn = !!firstName;
  return (
    <h2 className="text-3xl font-semibold mb-4">
      {isLoggedIn ? `How can I help you, ${firstName}?` : 'How can I help you?'}
    </h2>
  );
};
