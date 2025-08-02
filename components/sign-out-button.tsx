'use client';

import { signOut } from 'next-auth/react';
import { showLogoutToast } from '@/components/auth-toast';

interface SignOutButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SignOutButton({ children, className }: SignOutButtonProps) {
  const handleSignOut = async () => {
    showLogoutToast();
    // Small delay to ensure toast shows before redirect
    setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 500);
  };

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      {children}
    </button>
  );
}
