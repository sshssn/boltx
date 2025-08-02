'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Onboarding } from './onboarding';

export function OnboardingProvider({
  children,
}: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id || session?.user?.type !== 'regular') {
      setShowOnboarding(false);
      return;
    }

    // Check if user has already completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(
      'boltX-onboarding-completed',
    );
    const hasSeenOnboarding = sessionStorage.getItem('boltX-onboarding-seen');

    if (hasCompletedOnboarding || hasSeenOnboarding) {
      setShowOnboarding(false);
      return;
    }

    // Show onboarding for first-time users
    setShowOnboarding(true);
    sessionStorage.setItem('boltX-onboarding-seen', 'true');
  }, [session]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
