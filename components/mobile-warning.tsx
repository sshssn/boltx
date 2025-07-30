'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent,
        );
      const isTabletDevice = /ipad|android(?=.*\b(?!.*mobile).*)/i.test(
        userAgent,
      );

      setIsMobile(isMobileDevice && !isTabletDevice);
      setIsTablet(isTabletDevice);

      // Only show warning for very small mobile devices
      if (isMobileDevice && window.innerWidth < 480) {
        const dismissed = localStorage.getItem('mobile-warning-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('mobile-warning-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="relative max-w-sm w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl shadow-2xl p-4 animate-in zoom-in-95 duration-200">
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Small Screen Detected
          </h3>
        </div>

        <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
          <p>You&apos;re using a small screen. Some features may be limited.</p>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1 text-xs">
              ⚠️ Limited Experience
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-xs">
              For the best experience, use a larger screen or rotate your
              device.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
