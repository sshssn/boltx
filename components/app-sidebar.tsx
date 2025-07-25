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
import { useState, useEffect, useRef } from 'react';
// @ts-expect-error: no types for blueimp-md5
import md5 from 'blueimp-md5';
import { useIsMobile } from '@/hooks/use-mobile';

function getGravatarUrl(email: string) {
  if (!email) return undefined;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

// Floating pill for desktop/iPad: sidebar toggle, search, new chat, theme toggle
type SidebarFloatingPillOldProps = {
  setShowFloatingSearch: (v: boolean) => void;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  router: { push?: (path: string) => void };
};
function SidebarFloatingPillOld({
  setShowFloatingSearch,
  router,
}: Omit<SidebarFloatingPillOldProps, 'setTheme' | 'resolvedTheme'>) {
  return (
    <div
      className="fixed left-4 top-4 z-50 hidden lg:flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-2 py-1.5 h-12 min-w-[96px] max-h-12"
      style={{ aspectRatio: '1/1' }}
    >
      <SidebarToggle aria-label="Open sidebar" />
      <button
        type="button"
        className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-8 h-8 flex items-center justify-center"
        aria-label="Search"
        onClick={() => setShowFloatingSearch(true)}
      >
        <span className="text-zinc-500">
          <SearchIcon size={16} />
        </span>
      </button>
      <button
        type="button"
        className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-8 h-8 flex items-center justify-center"
        aria-label="New Chat"
        onClick={() => router.push?.('/')}
      >
        <PlusIcon size={16} />
      </button>
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
  const isLoggedIn = !!user && isRegularUser;
  const firstName = user?.name?.split(' ')[0] || '';
  const gravatar = user?.email ? getGravatarUrl(user.email) : undefined;

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

  // Mobile overlay for sidebar
  const sidebarOverlay = open && isMobile && (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={toggleSidebar}
      aria-hidden="true"
    />
  );

  // Hamburger for mobile (always visible)
  if (isMobile && !open) {
    return (
      <>
        <button
          type="button"
          className="fixed left-2 top-2 z-50 flex items-center justify-center rounded-full bg-background/90 border shadow-lg p-2 lg:hidden"
          aria-label="Open sidebar"
          onClick={toggleSidebar}
        >
          <MenuIcon size={22} />
        </button>
      </>
    );
  }

  // Desktop/iPad floating pill (old version)
  if (!isMobile && !open) {
    return (
      <>
        {/* Left pill: sidebar toggle, search, new chat */}
        <div
          className="fixed left-4 top-4 z-50 hidden lg:flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-4 py-1.5 h-12 min-w-[128px] max-h-12 justify-center"
          style={{ aspectRatio: '1/1' }}
        >
          <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-200/40 dark:hover:!bg-zinc-800/40 transition-all duration-100 relative z-10" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={(e) => {
              e.stopPropagation();
              setShowFloatingSearch(true);
            }}
            className="relative z-20"
          >
            <SearchIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New Chat"
            onClick={() => router.push?.('/')}
            className="relative z-10"
          >
            <PlusIcon size={16} />
          </Button>
        </div>
        {/* Right pill: settings, theme toggle */}
        <div
          className="fixed right-4 top-4 z-50 hidden lg:flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-1.5 py-1.5 h-12 min-w-[72px] max-h-12"
          style={{ aspectRatio: '1/1' }}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            onClick={() => router.push?.('/account')}
          >
            <Cog size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() =>
              setTheme((resolvedTheme ?? 'light') === 'dark' ? 'light' : 'dark')
            }
          >
            {(resolvedTheme ?? 'light') === 'dark' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </Button>
        </div>
      </>
    );
  }

  // Sidebar closed - mobile floating controls
  if (!open) {
    return (
      <>
        <div className="fixed left-2 top-2 sm:left-4 sm:top-4 z-50 flex items-center gap-1 sm:gap-2 bg-background/95 backdrop-blur-sm border rounded-full shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 font-lato">
          <SidebarToggle aria-label="Open sidebar" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="size-7 sm:size-8"
            onClick={() => setShowFloatingSearch(true)}
          >
            <span className="size-4 text-zinc-500">
              <SearchIcon size={16} />
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New Chat"
            className="size-7 sm:size-8"
            onClick={() => router.push('/')}
          >
            <PlusIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="size-7 sm:size-8"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>

        {/* Floating search overlay */}
        {showFloatingSearch && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-[6px] transition-all animate-fade-in"
            onClick={() => setShowFloatingSearch(false)}
          >
            <div
              className="relative bg-white/60 dark:bg-zinc-900/80 border border-white/30 dark:border-zinc-700 rounded-3xl shadow-2xl p-6 py-6 flex flex-col items-center gap-4 backdrop-blur-2xl w-full max-w-md mx-auto animate-fade-in-up"
              style={{
                boxShadow: '0 8px 40px 0 rgba(31,38,135,0.18)',
                backdropFilter: 'blur(24px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dismiss button */}
              <button
                type="button"
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                onClick={() => setShowFloatingSearch(false)}
                aria-label="Dismiss"
              >
                <X className="size-5" />
              </button>
              {/* Search bar */}
              <div className="w-full flex items-center gap-2 rounded-xl border border-white/40 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/60 backdrop-blur-md shadow px-3 py-2">
                <span className="text-zinc-500">
                  <SearchIcon size={20} />
                </span>
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="text"
                  placeholder="Press Enter for new chat"
                  className="flex-1 bg-transparent border-none shadow-none text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0 focus:outline-none px-0"
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowFloatingSearch(false);
                      setSearch('');
                      router.push('/');
                    }
                  }}
                />
              </div>
              {/* Mini chat history */}
              <div className="w-full max-h-64 overflow-y-auto mt-2">
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
      {sidebarOverlay}
      <Sidebar
        {...props}
        className={`
          flex flex-col h-dvh min-h-0 bg-auth-gradient border-r border-border z-50 font-lato
          ${
            isMobile
              ? 'fixed left-0 top-0 w-80 max-w-[85vw] shadow-xl'
              : 'w-72 max-w-full z-20'
          }
        `}
      >
        <SidebarHeader className="flex flex-row items-center gap-4 px-4 py-4 sm:py-6 w-full">
          {/* Sidebar toggle (close/open) */}
          {!isMobile && (
            <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-200/40 dark:hover:!bg-zinc-800/40 transition-all duration-100" />
          )}
          {/* Logo */}
          <div
            className="flex items-center justify-center w-28 h-14 sm:w-32 sm:h-16 rounded-2xl bg-[#4B5DFE]/20 dark:bg-zinc-900/60 border border-white/30 shadow-xl backdrop-blur-2xl transition-all duration-100"
            style={{ backdropFilter: 'blur(18px)' }}
          >
            <Image
              src="/images/dark.svg"
              alt="boltX logo"
              width={isMobile ? 80 : 110}
              height={isMobile ? 26 : 36}
              className="object-contain"
              priority
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-4 sm:gap-6 px-3 sm:px-4">
          <Button
            className="w-full flex flex-row items-center justify-center gap-2 text-sm sm:text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white transition-colors py-2.5 sm:py-2 shadow-md max-w-[160px] sm:max-w-[180px] mx-auto font-lato"
            onClick={() => {
              router.push('/');
              if (isMobile) toggleSidebar();
            }}
            size="sm"
          >
            <PlusIcon size={16} />
            <span>New Chat</span>
          </Button>

          {/* Search bar using shadcn/ui Input */}
          <div
            className="flex items-center gap-2 mt-2 rounded-xl border border-white/30 dark:border-zinc-700 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-md shadow-md px-2 py-1 transition-all"
            style={{ boxShadow: '0 4px 24px 0 rgba(31,38,135,0.10)' }}
          >
            <Input
              type="text"
              placeholder="Search your threads"
              value={typeof search === 'string' ? search : ''}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none shadow-none text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0 focus:outline-none px-0"
            />
            <span className="text-muted-foreground">
              <SearchIcon size={20} />
            </span>
          </div>
          {/* Theme toggle for mobile only */}
          {isMobile && (
            <div className="flex items-center justify-center mt-2">
              <button
                type="button"
                className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                aria-label="Toggle theme"
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
              >
                {resolvedTheme === 'dark' ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>
            </div>
          )}

          {/* Floating search bar overlay */}
          {showFloatingSearch && (
            <div
              className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/30 backdrop-blur-sm p-4"
              onClick={() => setShowFloatingSearch(false)}
            >
              <div
                className="mt-16 sm:mt-24 bg-[#4B5DFE]/30 dark:bg-zinc-900/80 border border-white/30 dark:border-zinc-700 rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-2 backdrop-blur-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <SearchIcon size={18} />
                  </div>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search your threads (search icon)"
                    className="pl-10 pr-3 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-background text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full"
                    value={search || ''}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFloatingSearch(false)}
                  aria-label="Close search"
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <SidebarHistory user={user} search={search} />
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center border-t shrink-0 gap-2 py-3 sm:py-4 px-3 sm:px-4">
          {status === 'loading' ? (
            <Button
              className="w-full flex flex-row items-center justify-center gap-2 text-sm sm:text-base font-semibold rounded-lg bg-muted text-muted-foreground transition-colors py-2.5 sm:py-2 shadow-md max-w-[160px] sm:max-w-[180px] mx-auto font-lato cursor-wait"
              disabled
              size="sm"
            >
              <LoaderIcon size={16} />
              <span>Loading...</span>
            </Button>
          ) : isLoggedIn ? (
            <Button
              className="w-full flex flex-row items-center justify-center gap-2 text-sm sm:text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white transition-colors py-2.5 sm:py-2 shadow-md max-w-[160px] sm:max-w-[180px] mx-auto font-lato"
              onClick={() => {
                router.push('/account');
                if (isMobile) toggleSidebar();
              }}
              size="sm"
            >
              <User size={16} />
              <span>Account</span>
            </Button>
          ) : (
            <Button
              className="w-full flex flex-row items-center justify-center gap-2 text-sm sm:text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white transition-colors py-2.5 sm:py-2 shadow-md max-w-[160px] sm:max-w-[180px] mx-auto font-lato"
              onClick={async () => {
                await signIn();
                router.refresh();
                if (isMobile) toggleSidebar();
              }}
              size="sm"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
