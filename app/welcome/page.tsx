'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const [count, setCount] = useState(5);
  const router = useRouter();

  useEffect(() => {
    if (count === 0) {
      router.replace('/chat');
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, router]);

  useEffect(() => {
    // Confetti animation
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">
          Welcome to boltX!
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 mb-4 text-center">
          🎉 Your account is ready and your message limit has been increased!
          <br />
          Enjoy more features and a better experience.
        </p>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          Redirecting to chat in{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-300">
            {count}
          </span>{' '}
          seconds...
        </div>
        <div className="w-full flex justify-center mt-2">
          <div className="h-2 w-2/3 bg-indigo-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-1000"
              style={{ width: `${(count / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
