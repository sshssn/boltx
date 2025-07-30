'use client';

import { LoginForm } from '@/components/login-form';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if user is authenticated and has a regular account
    if (status === 'authenticated' && session?.user?.type === 'regular') {
      // Use replace to prevent back button issues
      router.replace('/welcome');
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
