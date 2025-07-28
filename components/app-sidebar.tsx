'use client';
import { useSession, signIn } from 'next-auth/react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
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

// Legacy function - keeping for backward compatibility
function getGravatarUrl(email: string) {
  if (!email) return undefined;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
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
  const isLoggedIn = !!user && isRegularUser;
  const { username } = useUsername();
  const displayUsername = username || user?.name?.split(' ')[0] || '';
  const avatarUrl = user?.email
    ? getAvatarUrlForComponent(user.email, 32)
    : undefined;

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

  // Desktop/tablet floating controls when sidebar is closed
  if (!open && !isMobile) {
    return (
      <>
        {/* Left floating pill: sidebar toggle, search, new chat */}
        <div className="fixed left-4 top-4 z-50 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl shadow-xl px-2 py-2 transition-all duration-300 hover:shadow-2xl">
          <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-100/60 dark:hover:!bg-zinc-800/60 transition-all duration-200 !p-2 !h-9 !w-9" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search conversations"
            onClick={(e) => {
              e.stopPropagation();
              setShowFloatingSearch(true);
            }}
            className="h-9 w-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <SearchIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New Chat"
            onClick={() => router.push?.('/')}
            className="h-9 w-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
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
            className="h-9 w-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
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
            className="h-9 w-9 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            {(resolvedTheme ?? 'light') === 'dark' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </Button>
        </div>

        {/* Enhanced floating search overlay */}
        {showFloatingSearch && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-md transition-all animate-in fade-in duration-200"
            onClick={() => setShowFloatingSearch(false)}
          >
            <div
              className="relative bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 backdrop-blur-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setShowFloatingSearch(false)}
                aria-label="Close search"
              >
                <X className="size-5" />
              </button>

              <div className="w-full flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm px-4 py-3">
                <div className="text-zinc-500">
                  <SearchIcon size={20} />
                </div>
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="text"
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent border-none text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowFloatingSearch(false);
                      // Focus search in sidebar if needed
                    }
                  }}
                />
              </div>

              <div className="w-full max-h-64 overflow-y-auto">
                <SidebarHistory user={user} search={search} />
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
        className="flex flex-col h-dvh min-h-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 w-72 max-w-full transition-all duration-300"
      >
        <SidebarHeader className="flex flex-row items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {/* Sidebar toggle */}
          <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-100 dark:hover:!bg-zinc-800 transition-all duration-200 flex-shrink-0" />

          {/* Logo container - optimized sizing */}
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md h-10 px-3 w-auto">
            <Link
              href="/"
              className="flex items-center justify-center w-full h-full"
              onClick={() => isMobile && toggleSidebar()}
            >
              <Image
                src="/images/dark.svg"
                alt="boltX"
                width={80}
                height={24}
                className="object-contain w-auto h-6"
                priority
              />
            </Link>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-4 px-3 py-4 bg-white dark:bg-zinc-950">
          {/* New Chat Button - improved mobile sizing */}
          <Button
            className={`
              w-full flex items-center justify-center gap-2 
              text-sm font-semibold rounded-xl 
              bg-gradient-to-r from-blue-600 to-indigo-600 
              hover:from-blue-700 hover:to-indigo-700 
              text-white shadow-lg hover:shadow-xl 
              transition-all duration-200 hover:scale-[1.02] 
              py-3 px-4 border-0
              ${isMobile ? 'text-base py-3.5' : 'text-sm py-3'}
            `}
            onClick={() => {
              router.push('/');
              if (isMobile) toggleSidebar();
            }}
          >
            <PlusIcon size={16} />
            <span>New Chat</span>
          </Button>

          {/* Search bar - enhanced mobile experience */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm px-3 py-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 dark:focus-within:border-blue-600">
            <div className="text-zinc-500 flex-shrink-0">
              <SearchIcon size={18} />
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

        <SidebarFooter className="flex flex-col items-center border-t border-zinc-200 dark:border-zinc-800 gap-3 p-4 bg-white dark:bg-zinc-950">
          {/* Usage Counter */}
          <UsageCounter />

          {/* Global Message Limit Display */}
          <GlobalMessageLimit />

          {status === 'loading' ? (
            <Button
              className={`
                w-full flex items-center justify-center gap-2 
                text-sm font-medium rounded-xl 
                bg-zinc-100 dark:bg-zinc-800 
                text-zinc-500 dark:text-zinc-400 
                cursor-wait py-3 px-4
                ${isMobile ? 'text-base py-3.5' : 'text-sm py-3'}
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
                w-full flex items-center justify-center gap-2 
                text-sm font-semibold rounded-xl 
                bg-zinc-100 hover:bg-zinc-200 
                dark:bg-zinc-800 dark:hover:bg-zinc-700 
                text-zinc-700 dark:text-zinc-300 
                hover:text-zinc-900 dark:hover:text-zinc-100 
                transition-all duration-200 hover:scale-[1.02] 
                py-3 px-4 shadow-sm hover:shadow-md
                ${isMobile ? 'text-base py-3.5' : 'text-sm py-3'}
              `}
              onClick={() => {
                router.push('/account');
                if (isMobile) toggleSidebar();
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayUsername}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <User size={16} />
              )}
              <span>{displayUsername || 'Account'}</span>
            </Button>
          ) : (
            <Button
              className={`
                w-full flex items-center justify-center gap-2 
                text-sm font-semibold rounded-xl 
                bg-gradient-to-r from-blue-600 to-indigo-600 
                hover:from-blue-700 hover:to-indigo-700 
                text-white shadow-lg hover:shadow-xl 
                transition-all duration-200 hover:scale-[1.02] 
                py-3 px-4 border-0
                ${isMobile ? 'text-base py-3.5' : 'text-sm py-3'}
              `}
              onClick={async () => {
                await signIn();
                router.refresh();
                if (isMobile) toggleSidebar();
              }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Button>
          )}

          {/* Theme toggle for mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2"
              onClick={() =>
                setTheme(
                  (resolvedTheme ?? 'light') === 'dark' ? 'light' : 'dark',
                )
              }
            >
              {(resolvedTheme ?? 'light') === 'dark' ? (
                <>
                  <Sun size={16} />
                  <span>Light mode</span>
                </>
              ) : (
                <>
                  <Moon size={16} />
                  <span>Dark mode</span>
                </>
              )}
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
