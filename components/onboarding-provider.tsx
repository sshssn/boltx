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
    if (status === 'loading') return;

    // Check if user is authenticated and is a regular user (not guest)
    if (session?.user?.type === 'regular') {
      // Check if onboarding has been completed
      const onboardingCompleted = localStorage.getItem('onboarding-completed');

      if (!onboardingCompleted) {
        // Show onboarding for new registered users
        setShowOnboarding(true);
      }
    }

    setIsLoading(false);
  }, [session, status]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  return <>{children}</>;
}
