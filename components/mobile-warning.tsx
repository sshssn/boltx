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

      // Show warning for mobile and tablet devices
      if (isMobileDevice || isTabletDevice) {
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
      <div className="relative max-w-md w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 mb-4">
          {isMobile ? (
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <Tablet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          )}
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isMobile ? 'Mobile Device Detected' : 'Tablet Device Detected'}
          </h3>
        </div>

        <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            You&apos;re currently using a {isMobile ? 'mobile' : 'tablet'}{' '}
            device. The boltX application is currently in beta and may not be
            fully optimized for {isMobile ? 'mobile' : 'tablet'} screens.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              ⚠️ Use at your own risk
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-xs">
              Some features may not work as expected on{' '}
              {isMobile ? 'mobile' : 'tablet'} devices. For the best experience,
              we recommend using a desktop computer.
            </p>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You can dismiss this warning and continue using the app, but please
            be aware of potential limitations.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue Anyway
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex-1"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
