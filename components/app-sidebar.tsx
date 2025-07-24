'use client';
import { useSession, signIn } from 'next-auth/react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarHistory } from '@/components/sidebar-history';
import { BoxIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState } from 'react';
// @ts-expect-error: no types for blueimp-md5
import md5 from 'blueimp-md5';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LogIn } from 'lucide-react';
import { SidebarUserNav } from './sidebar-user-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sun, Moon } from 'lucide-react';
import { useRef } from 'react';
import { Logo } from './logo';

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
  // Prefer SSR user prop, fallback to client session
  const user = typeof userProp !== 'undefined' ? userProp : session?.user;
  const userType = user?.type;
  const isRegularUser = userType === 'regular';
  const isLoggedIn = !!user && isRegularUser;
  const firstName = user?.name?.split(' ')[0] || '';
  const gravatar = user?.email ? getGravatarUrl(user.email) : undefined;

  // Sidebar closed pill
  if (!open) {
    return (
      <>
        {isMobile && (
          <div className="fixed left-4 top-4 z-50">
            <SidebarToggle />
          </div>
        )}
        <div className="fixed left-4 top-4 z-50 flex items-center gap-2 bg-background/80 border rounded-full shadow-lg px-3 py-2 font-lato">
          {!isMobile && <SidebarToggle aria-label="Open sidebar" />}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }}
          >
            <SearchIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="New Chat"
            onClick={() => router.push('/')}
          >
            <PlusIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </>
    );
  }

  return (
    <Sidebar
      {...props}
      className="flex flex-col h-dvh min-h-0 w-[18rem] max-w-full bg-auth-gradient border-r border-border z-20 font-lato"
    >
      <SidebarHeader className="flex flex-col items-center justify-center flex-shrink-0 py-6 gap-3">
        <div
          className="w-28 h-14 rounded-2xl bg-white/30 dark:bg-zinc-900/60 border border-white/30 shadow-xl backdrop-blur-2xl flex items-center justify-center transition-all duration-100"
          style={{ backdropFilter: 'blur(18px)' }}
        >
          <Image
            src="/images/dark.svg"
            alt="boltX logo"
            width={100}
            height={32}
          />
        </div>
        <SidebarToggle className="!shadow-none !border-none !bg-transparent hover:!bg-zinc-200/40 dark:hover:!bg-zinc-800/40 transition-all duration-100" />
      </SidebarHeader>
      <SidebarContent className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-6 px-4">
        <Button
          className="w-full flex flex-row items-center justify-center gap-2 text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white transition-colors py-2 shadow-md max-w-[180px] mx-auto font-lato"
          onClick={() => router.push('/')}
          size="sm"
        >
          <PlusIcon size={18} />
          <span>New Chat</span>
        </Button>
        <Input
          ref={searchInputRef}
          placeholder="Search your threads..."
          className="pl-10 pr-3 py-2 rounded-full bg-muted border-0 focus:ring-2 focus:ring-primary focus:border-0 shadow-none mt-2 font-lato"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ boxShadow: 'none', border: 'none' }}
        />
        <SidebarHistory user={user} search={search} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-center border-t flex-shrink-0 gap-2 py-4">
        {isLoggedIn ? (
          <SidebarUserNav user={user} />
        ) : (
          <Button
            className="w-full flex flex-row items-center justify-center gap-2 text-base font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white transition-colors py-2 shadow-md max-w-[180px] mx-auto font-lato"
            onClick={() => signIn()}
            size="sm"
          >
            <LogIn size={18} />
            <span>Login</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
