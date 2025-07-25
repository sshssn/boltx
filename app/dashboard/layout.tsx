'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col">
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <DashboardNavbar />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
