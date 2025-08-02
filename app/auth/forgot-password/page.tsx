'use client';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast({
          type: 'success',
          description: data.message || 'If this email exists, a reset link will be sent.',
        });
      } else {
        toast({
          type: 'error',
          description: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        type: 'error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="email" className="font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2 bg-muted"
            placeholder="you@example.com"
            disabled={isLoading}
          />
          <Button type="submit" className="mt-4" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        {submitted && (
          <p className="mt-4 text-center text-muted-foreground text-sm">
            If this email exists, a reset link will be sent. Check your email and spam folder.
          </p>
        )}
        <div className="mt-6 text-center">
          <a
            href="/auth"
            className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
