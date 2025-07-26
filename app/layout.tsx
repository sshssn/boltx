import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { ChatTitleUpdatesProvider } from '@/components/chat-title-updates-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { DashboardOverlay } from '@/components/dashboard-overlay';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'boltX',
  description: 'Next-gen AI chat and productivity platform.',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-background text-foreground min-h-screen w-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>
            <ChatTitleUpdatesProvider>
              <DashboardOverlay>
                {/* Dashboard content goes here */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    Profile/Settings (TODO)
                  </div>
                  <div className="p-4 border rounded-lg">
                    Subscription/Billing (TODO)
                  </div>
                  <div className="p-4 border rounded-lg">
                    Integrations (TODO)
                  </div>
                  <div className="p-4 border rounded-lg">
                    Support/Help (TODO)
                  </div>
                </div>
              </DashboardOverlay>
              <main className="w-full min-h-screen flex flex-col">
                {children}
              </main>
              <Analytics />
            </ChatTitleUpdatesProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
