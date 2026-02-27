'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { Sidebar, useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import Image from 'next/image';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="fixed left-0 top-0 z-20 w-[240px] h-screen flex flex-col justify-between pointer-events-auto rounded-2xl bg-[rgba(30,27,38,0.7)] backdrop-blur-md border border-[#2A2433] shadow-xl p-4">
      <div className="flex flex-col flex-1 min-h-0">
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
          }}
          className="flex flex-row gap-3 items-center justify-center mb-6"
        >
          <span className="w-full flex items-center justify-center">
            <Image
              src="/images/light.svg"
              alt="Logo"
              width={224}
              height={70}
              className="inline dark:hidden w-full max-w-xs h-auto"
              priority
            />
            <Image
              src="/images/dark.svg"
              alt="Logo"
              width={224}
              height={70}
              className="hidden dark:inline w-full max-w-xs h-auto"
              priority
            />
          </span>
        </Link>
        <button
          className="w-full bg-[#8E3AE6] text-white font-medium py-3 rounded-lg mb-4 text-base"
          type="button"
          onClick={() => {
            setOpenMobile(false);
            router.push('/');
            router.refresh();
          }}
        >
          New Chat
        </button>
        <input
          type="text"
          placeholder="Search your threads..."
          className="w-full p-3 bg-[#221C2E] text-sm text-white placeholder-gray-400 rounded-md outline-none mb-2 border-none"
        />
        <div className="flex-1 overflow-y-auto min-h-0 mt-2">
          <SidebarHistory user={user} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-[#B0A8C1] text-base px-2 py-3 mt-8">
        {user && <SidebarUserNav user={user} />}
      </div>
    </Sidebar>
  );
}
