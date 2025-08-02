'use client';

import { ChevronUp, LogIn, Settings, LogOut, User, Crown } from 'lucide-react';
import Image from 'next/image';
import type { User as UserType } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';
import { useUsername } from '@/hooks/use-username';
import { UserAvatar } from './user-avatar';

export function SidebarUserNav({ user }: { user: UserType }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');

  const { username } = useUsername();
  const isGuest = guestRegex.test(data?.user?.email ?? '');
  const isAdmin = data?.user?.role === 'admin';
  const displayName = username || data?.user?.username || user?.email?.split('@')[0] || 'User';
  const userEmail = data?.user?.email || user?.email || 'guest@example.com';

  // Debug log to see session data
  useEffect(() => {
    if (data?.user) {
      console.log('Session data:', {
        email: data.user.email,
        type: data.user.type,
        id: data.user.id,
        username: data.user.username
      });
    }
  }, [data]);

  // Fetch user plan
  useEffect(() => {
    if (status === 'loading' || !data?.user) return;

    async function fetchUserPlan() {
      try {
        const res = await fetch('/api/profile/plan');
        if (res.ok) {
          const planData = await res.json();
          setUserPlan(planData.plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    }
    fetchUserPlan();
  }, [data, status]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirect: false });
      router.push('/');
      toast({ type: 'success', description: 'Signed out successfully' });
    } catch (error) {
      toast({ type: 'error', description: 'Failed to sign out' });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAccountClick = () => {
    if (isAdmin) {
      router.push('/admin');
    } else if (isGuest) {
      router.push('/auth');
    } else {
      router.push('/account');
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast({
      type: 'success',
      description: `Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`,
    });
  };

  if (status === 'loading') {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 animate-pulse">
            <div className="size-8 rounded-full bg-muted-foreground/20" />
            <div className="flex-1 h-4 bg-muted-foreground/20 rounded" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => router.push('/auth')}
            className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LogIn size={16} />
            Sign In
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              type="button"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/80 hover:bg-accent/80 border border-border/60 hover:border-border transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group"
              data-testid="user-nav-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar */}
              <UserAvatar
                email={userEmail}
                name={displayName}
                size={36}
                className="border-2 border-border/50 group-hover:border-border transition-colors shrink-0"
              />

              {/* User info with better layout */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="font-medium text-sm text-foreground truncate">
                    {isGuest ? 'Guest User' : displayName}
                  </div>
                  {!isGuest && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {isAdmin ? 'Admin' : userPlan === 'pro' ? 'Pro' : 'Free'}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {isGuest ? 'Limited access' : userEmail}
                </div>
                {/* Plan display line */}
                {!isGuest && (
                  <div className="text-xs text-muted-foreground/80 mt-0.5">
                    {displayName} -{' '}
                    {isAdmin
                      ? 'Admin'
                      : userPlan === 'pro'
                        ? 'Pro Plan'
                        : 'Free Plan'}
                  </div>
                )}
              </div>

              {/* Chevron */}
              <motion.div
                className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                whileHover={{ y: -1 }}
              >
                <ChevronUp size={14} />
              </motion.div>
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side={isMobile ? 'top' : 'right'}
            className="w-60 p-2"
            sideOffset={8}
          >
            {/* Enhanced User info header */}
            <div className="p-2 mb-1 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <UserAvatar
                  email={userEmail}
                  name={displayName}
                  size={32}
                  className="border-2 border-border/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="font-medium text-sm truncate">
                      {isGuest ? 'Guest User' : displayName}
                    </div>
                    {!isGuest && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {isAdmin
                          ? 'Admin'
                          : userPlan === 'pro'
                            ? 'Pro'
                            : 'Free'}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </div>
                  {!isGuest && (
                    <div className="text-xs text-muted-foreground/80 mt-0.5">
                      {displayName} -{' '}
                      {userPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Account settings */}
            {!isGuest && (
              <DropdownMenuItem
                onClick={handleAccountClick}
                className="cursor-pointer"
              >
                <User size={16} />
                {isAdmin ? 'Admin Dashboard' : 'Account Settings'}
              </DropdownMenuItem>
            )}

            {/* Theme toggle */}
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
              <Settings size={16} />
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign out */}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                  >
                    <LoaderIcon size={16} />
                  </motion.div>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Sign Out
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
