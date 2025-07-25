'use client';
import { useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function ChatLayoutInner({
  children,
}: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background text-foreground transition-colors">
      {/* Sidebar: show as column on mobile, as side panel on desktop */}
      {open && !isMobile && (
        <div className="w-64 h-full border-r border-zinc-800/60 bg-background z-20">
          <AppSidebar />
        </div>
      )}
      <main className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden p-2 sm:p-4 md:p-6">
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
      </main>
    </div>
  );
}
