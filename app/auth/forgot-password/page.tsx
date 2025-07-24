'use client';
import { useState } from 'react';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    toast({
      type: 'success',
      description: 'If this email exists, a reset link will be sent.',
    });
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
          />
          <Button type="submit" className="mt-4">
            Send Reset Link
          </Button>
        </form>
        {submitted && (
          <p className="mt-4 text-center text-muted-foreground text-sm">
            If this email exists, a reset link will be sent.
          </p>
        )}
      </div>
    </div>
  );
}
