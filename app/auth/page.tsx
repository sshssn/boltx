'use client';

import { LoginForm } from '@/components/login-form';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users based on their role
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'admin') {
        // Admin users go to admin dashboard
        router.replace('/admin');
      } else if (session.user.role === 'regular') {
        // Regular users go to main chat page
        router.replace('/');
      }
      // Don't redirect guest users - let them stay on auth page to sign in
    }
  }, [session, status, router]);

  // Don't render anything while checking authentication
  if (status === 'loading') {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a]">
        <div className="animate-spin rounded-full size-8 border-b-2 border-white" />
      </div>
    );
  }

  return <LoginForm />;
}
