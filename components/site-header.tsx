import { SidebarToggle } from '@/components/sidebar-toggle';
import { Logo } from '@/components/logo';

export function SiteHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center border-b px-4 lg:px-6">
      <div className="flex w-full items-center justify-between">
        {/* Sidebar toggle on far left */}
        <div className="flex items-center">
          <SidebarToggle className="mr-2" />
        </div>
        {/* Logo centered absolutely */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-fit">
          <Logo className="h-8 w-auto" />
        </div>
        {/* Placeholder for right side (can add user menu, etc.) */}
        <div className="flex items-center" style={{ minWidth: 40 }} />
      </div>
    </header>
  );
}
