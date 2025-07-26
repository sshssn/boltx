'use client';

import { LoginForm } from '@/components/login-form';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.type === 'regular') {
      router.replace('/welcome');
    }
  }, [session, status, router]);

  return (
    <div className="relative min-h-svh w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a]">
      {/* Back to Chat Button */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <Link href="/">
          <button
            type="button"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium shadow border border-white/20 backdrop-blur-md transition-all"
          >
            ← Back to Chat
          </button>
        </Link>
      </div>
      <div className="w-full max-w-4xl mt-16 md:mt-24 mb-4 md:mb-8 px-4 md:px-0">
        <LoginForm />
      </div>
    </div>
  );
}
