'use client';
import { usePathname } from 'next/navigation';
import { MessageCircleIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavUser } from '@/components/nav-user';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/messages': 'Messages',
  '/account': 'My Account',
  '/billing': 'Billing',
  '/integrations': 'Integrations',
  '/support': 'Support',
};

export function DashboardNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <Link href="/chat">
          <Button variant="secondary" className="rounded-lg px-3 py-2">
            <MessageCircleIcon className="mr-2 size-5" />
            Back to Chat
          </Button>
        </Link>
        <NavUser />
      </div>
    </header>
  );
}
