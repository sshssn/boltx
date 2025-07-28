'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    // Sync subscription data
    const syncSubscription = async () => {
      try {
        const response = await fetch('/api/stripe/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to sync subscription');
        }

        // Wait a moment for the sync to complete
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (err) {
        console.error('Error syncing subscription:', err);
        setError('Failed to sync subscription data');
        setIsLoading(false);
      }
    };

    syncSubscription();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Setting up your Pro plan...</h1>
          <p className="text-muted-foreground">
            Please wait while we configure your subscription.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push('/account')}>Go to Account</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Pro!</h1>
          <p className="text-muted-foreground">
            Your Pro plan trial has been activated. You now have access to all
            premium features.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">What&apos;s included:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 500 messages per day</li>
              <li>• Advanced AI models</li>
              <li>• Priority support</li>
              <li>• 30-day free trial</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => router.push('/')}>
              Start Chatting
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/account')}
            >
              View Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
