'use client';
import { useSession, signIn } from 'next-auth/react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { SignOutButton } from '@/components/sign-out-button';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarHistory } from '@/components/sidebar-history';
import { PlusIcon, SearchIcon, MenuIcon, LoaderIcon } from '@/components/icons';
import { Sun, Moon, Cog, Palette, X, User, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
// @ts-expect-error: no types for blueimp-md5
import md5 from 'blueimp-md5';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlobalMessageLimit } from '@/components/global-message-limit';
import { UsageCounter } from '@/components/usage-counter';
import { useUsername } from '@/hooks/use-username';
import { getAvatarUrlForComponent } from '@/lib/gravatar';
import { useMessageLimit } from '@/components/message-limit-provider';
import { MessageSquare, Zap } from 'lucide-react';

// Legacy function - keeping for backward compatibility
function getGravatarUrl(email: string) {
  if (!email) return undefined;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

// Compact usage display for sidebar
function CompactUsageDisplay() {
  const messageLimitData = useMessageLimit();
  
  // Check if the hook is available
  if (!messageLimitData) {
    return null;
  }

  const { messagesUsed, messagesLimit, remaining, isGuest, isLoading } = messageLimitData;

  // Don't show if loading
  if (isLoading) return null;

  // For guests, show after first message or if they have used messages
  if (isGuest && messagesUsed === 0) return null;

  // Calculate usage percentage
  const usagePercent = Math.min((messagesUsed / messagesLimit) * 100, 100);

  // Determine color based on usage
  const getProgressColor = () => {
    if (usagePercent >= 90) return 'bg-red-500';
    if (usagePercent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full p-1.5 bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200/40 dark:border-zinc-700/40 rounded-md">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <MessageSquare className="size-2.5 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {isGuest ? 'Guest' : 'Usage'}
          </span>
        </div>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {messagesUsed}/{messagesLimit}
        </span>
      </div>

      <div className="space-y-0.5">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full transition-all ${getProgressColor()}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{remaining} left</span>
          <div className="flex items-center gap-0.5">
            <Zap className="size-2" />
            <span className="text-xs">{isGuest ? 'Guest' : 'Regular'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  user: userProp,
  ...props
}: { user?: any } & React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  // Prefer SSR user prop, fallback to client session
  const user = typeof userProp !== 'undefined' ? userProp : session?.user;
  const userType = user?.type;
  const isRegularUser = userType === 'regular';
  const isAdminUser = userType === 'admin';
  const isLoggedIn = !!user && (isRegularUser || isAdminUser);
  const { username } = useUsername();
  const displayUsername = username || user?.name?.split(' ')[0] || '';
  const avatarUrl = user?.email
    ? getAvatarUrlForComponent(user.email, 48)
    : user?.image || undefined;

  // Persistent guest ID logic
  useEffect(() => {
    if (!session && typeof window !== 'undefined') {
      const guestId = localStorage.getItem('boltx-guest-id');
      if (!guestId) {
        signIn('guest', { redirect: false }).then((res) => {
          // After sign in, session will update and we can store the ID
        });
      } else {
        signIn('credentials', {
          email: guestId,
          password: 'guest',
          redirect: false,
        });
      }
    } else if (
      session?.user?.type === 'guest' &&
      typeof window !== 'undefined'
    ) {
      localStorage.setItem(
        'boltx-guest-id',
        session.user.email || session.user.id,
      );
    }
  }, [session]);

  // Listen for new chat creation events
  useEffect(() => {
    const handleNewChat = (event: CustomEvent) => {
      const chatId = event.detail?.chatId;
      if (chatId) {
        // Dispatch the event to the sidebar history
        window.dispatchEvent(
          new CustomEvent('new-chat-created', {
            detail: { chatId },
          }),
        );
      }
    };

    const handleTitleGenerated = (event: CustomEvent) => {
      const { chatId, title } = event.detail;
      if (chatId && title && title !== 'New Thread...') {
        // Dispatch the event to update the sidebar
        window.dispatchEvent(
          new CustomEvent('threadTitleUpdated', {
            detail: { threadId: chatId, title },
          }),
        );
      }
    };

    window.addEventListener('chat-created', handleNewChat as EventListener);
    window.addEventListener(
      'title-generated',
      handleTitleGenerated as EventListener,
    );

    return () => {
      window.removeEventListener(
        'chat-created',
        handleNewChat as EventListener,
      );
      window.removeEventListener(
        'title-generated',
        handleTitleGenerated as EventListener,
      );
    };
  }, []);

  // Desktop/tablet floating controls when sidebar is closed
  if (!open && !isMobile) {
    return (
      <>
        {/* Left floating pill: sidebar toggle, search, new chat */}
        <div className="fixed left-4 top-4 z-50 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl shadow-xl p-2 transition-all duration-300 hover:shadow-2xl">
          <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-100/60 dark:hover:!bg-zinc-800/60 transition-all duration-200 !p-2 !h-9 !w-9" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search conversations"
            onClick={(e) => {
              e.stopPropagation();
              setShowFloatingSearch(true);
            }}
            className="size-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <SearchIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New Chat"
            onClick={() => router.push?.('/')}
            className="size-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <PlusIcon size={16} />
          </Button>
        </div>

        {/* Right floating pill: settings, theme toggle */}
        <div className="fixed right-4 top-4 z-50 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl shadow-xl p-2 transition-all duration-300 hover:shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account Settings"
            onClick={() => router.push?.('/account')}
            className="size-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <Cog size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme((resolvedTheme ?? 'light') === 'dark' ? 'light' : 'dark')
            }
            className="size-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            {(resolvedTheme ?? 'light') === 'dark' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </Button>
        </div>

        {/* Enhanced floating search overlay - updated design */}
        {showFloatingSearch && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-200"
            onClick={() => setShowFloatingSearch(false)}
          >
            <div
              className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-top-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search container */}
              <div className="p-6">
                {/* Search input */}
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-sm px-3 py-2.5 mb-4 relative">
                  <div className="text-zinc-500 dark:text-zinc-400">
                    <SearchIcon size={16} />
                  </div>
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600" />
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/');
                      setShowFloatingSearch(false);
                    }}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 rounded"
                  >
                    <PlusIcon size={14} />
                  </button>
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    placeholder="Search or press Enter to start new chat"
                    className="flex-1 bg-transparent border-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
                    value={search || ''}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (!search || search.trim() === '') {
                          // Start new chat if no search term
                          router.push('/');
                          setShowFloatingSearch(false);
                        } else {
                          // Just close search if there's a search term
                          setShowFloatingSearch(false);
                        }
                      }
                      if (e.key === 'Escape') {
                        setShowFloatingSearch(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 rounded"
                    onClick={() => setShowFloatingSearch(false)}
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search results */}
                <div className="max-h-64 overflow-y-auto rounded-xl bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm border border-zinc-200/40 dark:border-zinc-700/40">
                  <SidebarHistory user={user} search={search} />
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Main sidebar
  return (
    <>
      <Sidebar
        {...props}
        className="flex flex-col h-dvh min-h-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 w-64 max-w-full transition-all duration-300"
      >
        <SidebarHeader className="flex flex-col items-center gap-3 p-3 bg-white dark:bg-zinc-950">
          {/* Sidebar toggle */}
          <div className="flex items-center justify-between w-full">
            <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-100 dark:hover:!bg-zinc-800 transition-all duration-200 shrink-0" />
          </div>

          {/* Logo container - standard size */}
          <div className="flex items-center justify-center h-12 px-4 w-auto">
            <Link
              href="/"
              className="flex items-center justify-center size-full"
              onClick={() => isMobile && toggleSidebar()}
            >
              <Image
                src="/images/dark.svg"
                alt="boltX"
                width={100}
                height={28}
                className="object-contain w-auto h-6"
                priority
              />
            </Link>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-3 px-2 py-3 bg-white dark:bg-zinc-950">
          {/* New Chat Button - reduced width */}
          <div className="flex justify-center">
            <Button
              className={`
                w-48 flex items-center justify-center gap-2 
                text-sm font-semibold rounded-lg 
                bg-gradient-to-r from-blue-600 to-indigo-600 
                hover:from-blue-700 hover:to-indigo-700 
                text-white shadow-lg hover:shadow-xl 
                transition-all duration-200 hover:scale-[1.02] 
                py-2.5 px-3 border-0
                ${isMobile ? 'text-base py-3 w-56' : 'text-sm py-2.5 w-48'}
              `}
              onClick={() => {
                router.push('/');
                if (isMobile) toggleSidebar();
              }}
            >
              <span>New Chat</span>
            </Button>
          </div>

          {/* Search bar - enhanced mobile experience */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="text-zinc-500 shrink-0">
              <SearchIcon size={16} />
            </div>
            <Input
              type="text"
              placeholder="Search conversations..."
              value={typeof search === 'string' ? search : ''}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none shadow-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0 focus:outline-none px-0 h-auto py-1"
              data-global-search="true"
            />
          </div>

          {/* Chat History */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarHistory user={user} search={search} />
          </div>
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center border-t border-zinc-200 dark:border-zinc-800 gap-1.5 p-3 bg-white dark:bg-zinc-950">
          {/* Compact Usage Display */}
          <div className="w-full">
            <CompactUsageDisplay />
          </div>

          {/* Global Message Limit Display */}
          <GlobalMessageLimit />

          {status === 'loading' ? (
            <Button
              className={`
                w-full flex items-center justify-center gap-2 
                text-sm font-medium rounded-lg 
                bg-zinc-100 dark:bg-zinc-800 
                text-zinc-500 dark:text-zinc-400 
                cursor-wait py-2.5 px-3
                ${isMobile ? 'text-base py-3' : 'text-sm py-2.5'}
              `}
              disabled
            >
              <div className="animate-spin">
                <LoaderIcon size={16} />
              </div>
              <span>Loading...</span>
            </Button>
          ) : isLoggedIn ? (
            <Button
              className={`
                w-full flex items-center justify-between gap-3 
                text-sm font-semibold rounded-lg 
                bg-zinc-100 hover:bg-zinc-200 
                dark:bg-zinc-800 dark:hover:bg-zinc-700 
                text-zinc-700 dark:text-zinc-300 
                hover:text-zinc-900 dark:hover:text-zinc-100 
                transition-all duration-200 hover:scale-[1.02] 
                py-3 px-4 shadow-sm hover:shadow-md
                ${isMobile ? 'text-base py-3' : 'text-sm py-3'}
              `}
              onClick={() => {
                if (isAdminUser) {
                  router.push('/admin');
                } else {
                  router.push('/account');
                }
                if (isMobile) toggleSidebar();
              }}
            >
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayUsername}
                    className="size-8 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to user icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove(
                        'hidden',
                      );
                    }}
                  />
                ) : null}
                <User size={20} className={avatarUrl ? 'hidden' : ''} />
                <span className="font-medium">
                  {isAdminUser ? 'Admin' : displayUsername || 'Account'}
                </span>
              </div>
              <div className="flex items-center">
                <span
                  className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${
                    isAdminUser
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                      : user?.plan === 'pro'
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                  }
                `}
                >
                  {isAdminUser
                    ? 'Admin'
                    : user?.plan === 'pro'
                      ? 'Pro'
                      : 'Free'}
                </span>
              </div>
            </Button>
          ) : (
            <Button
              className={`
                w-full flex items-center justify-center gap-2 
                text-sm font-semibold rounded-lg 
                bg-white/90 dark:bg-zinc-900/90
                backdrop-blur-xl backdrop-saturate-150
                border border-zinc-200/60 dark:border-zinc-700/60
                shadow-lg shadow-black/5 dark:shadow-black/20
                hover:bg-white/95 dark:hover:bg-zinc-900/95
                hover:border-zinc-300/80 dark:hover:border-zinc-600/80
                hover:shadow-xl hover:shadow-black/10
                dark:hover:shadow-black/30
                text-zinc-700 dark:text-zinc-300 
                hover:text-zinc-900 dark:hover:text-zinc-100 
                transition-all duration-200 hover:scale-[1.02] 
                py-2.5 px-3
                ${isMobile ? 'text-base py-3' : 'text-sm py-2.5'}
              `}
              onClick={() => {
                router.push('/auth');
                if (isMobile) toggleSidebar();
              }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
