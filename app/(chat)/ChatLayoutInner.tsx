'use client';
import { useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function ChatLayoutInner({
  children,
}: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  return (
    <div className="flex flex-row h-screen w-full bg-background text-foreground transition-colors">
      {open && !isMobile && (
        <div className="w-64 h-full border-r border-zinc-800/60 bg-background z-20">
          <AppSidebar />
        </div>
      )}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="w-full h-full flex flex-col">{children}</div>
      </main>
    </div>
  );
}
