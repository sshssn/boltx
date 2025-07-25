'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirm) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess('Password reset! You can now log in.');
      setTimeout(() => router.push('/auth'), 2000);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to reset password.');
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <Image
          src="/images/dark.svg"
          alt="boltX logo"
          width={120}
          height={40}
          className="mb-4"
        />
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        {success && (
          <div className="text-green-500 text-sm mt-4">{success}</div>
        )}
      </div>
    </div>
  );
}
