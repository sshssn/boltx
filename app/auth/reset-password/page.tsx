'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      // In a real app, you would validate the token here
      setIsValidToken(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        type: 'error',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        type: 'error',
        description: 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          type: 'success',
          description: 'Password reset successfully! You can now sign in with your new password.',
        });
        // Redirect to sign in page
        window.location.href = '/auth';
      } else {
        toast({
          type: 'error',
          description: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        type: 'error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Invalid Reset Link</h2>
          <p className="text-center text-muted-foreground mb-6">
            This reset link is invalid or has expired. Please request a new password reset.
          </p>
          <div className="text-center">
            <a
              href="/auth/forgot-password"
              className="text-primary hover:text-primary/80 transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        <p className="text-center text-muted-foreground mb-6">
          Enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your new password"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Confirm your new password"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Loading...</h2>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
