'use client';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { UserIcon } from '@/components/icons';
import { useDashboardOverlay } from '@/hooks/use-dashboard-overlay';

export function NavUser() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const firstName = session?.user?.name?.split(' ')[0] || 'User';
  const openDashboard = useDashboardOverlay();

  if (!isLoggedIn) {
    return (
      <Button
        variant="ghost"
        className="w-full flex items-center gap-2"
        onClick={() => signIn()}
      >
        <UserIcon />
        Login
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      className="w-full flex items-center gap-2 font-semibold"
      onClick={openDashboard}
    >
      <UserIcon />
      {firstName}
    </Button>
  );
}
