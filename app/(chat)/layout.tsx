import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { ChatCacheProvider } from '@/components/chat-cache-provider';
import { MessageLimitProvider } from '@/components/message-limit-provider';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  // Sidebar is open by default unless user explicitly closed it
  const sidebarCookie = cookieStore.get('sidebar:state');
  const isCollapsed = sidebarCookie ? sidebarCookie.value === 'false' : false;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <MessageLimitProvider>
          <ChatCacheProvider>
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={session?.user} />
              <SidebarInset className="flex-1 min-w-0">
                <div className="flex flex-col h-dvh">{children}</div>
              </SidebarInset>
            </SidebarProvider>
          </ChatCacheProvider>
        </MessageLimitProvider>
      </DataStreamProvider>
    </>
  );
}
