'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/toast';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle URL parameters for mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'signup') {
      setMode('register');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    if (mode === 'login') {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const res = await import('@/app/(auth)/actions').then((m) =>
        m.login({ status: 'idle' }, formData),
      );
      setLoading(false);
      if (res.status === 'success') {
        toast({ type: 'success', description: 'Logged in successfully!' });
        router.push('/');
      } else if (res.status === 'invalid_data') {
        toast({ type: 'error', description: 'Invalid credentials.' });
      } else {
        toast({ type: 'error', description: 'Login failed.' });
      }
    } else if (mode === 'register') {
      if (!validateEmail(email)) {
        toast({ type: 'error', description: 'Please enter a valid email.' });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast({
          type: 'error',
          description: 'Password must be at least 6 characters.',
        });
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const res = await import('@/app/(auth)/actions').then((m) =>
        m.register({ status: 'idle' }, formData),
      );
      setLoading(false);
      if (res.status === 'success') {
        toast({
          type: 'success',
          description: 'Account created successfully!',
        });
        router.push('/');
      } else if (res.status === 'user_exists') {
        toast({ type: 'error', description: 'Account already exists.' });
      } else if (res.status === 'invalid_data') {
        toast({ type: 'error', description: 'Invalid registration data.' });
      } else {
        toast({ type: 'error', description: 'Registration failed.' });
      }
    } else if (mode === 'forgot') {
      if (!validateEmail(email)) {
        toast({ type: 'error', description: 'Please enter a valid email.' });
        setLoading(false);
        return;
      }
      // Simulate forgot password
      setTimeout(() => {
        toast({
          type: 'success',
          description: 'If this email exists, a reset link will be sent.',
        });
        setLoading(false);
        setMode('login');
      }, 1000);
    }
  }

  async function handleGitHubSignIn() {
    setLoading(true);
    try {
      const res = await signIn('github', { callbackUrl: '/' });
      if (res?.error) {
        toast({ type: 'error', description: 'GitHub authentication failed.' });
      }
    } catch (err) {
      toast({ type: 'error', description: 'GitHub authentication failed.' });
    }
    setLoading(false);
  }

  return (
    <div
      className={cn('flex flex-col gap-6 font-jetbrains', className)}
      {...props}
    >
      <Card className="overflow-hidden p-0 max-w-4xl w-full mx-auto shadow-2xl border border-primary/30 bg-[#4B5DFE]/30 dark:bg-zinc-900/90 backdrop-blur-xl">
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] p-0 min-h-[420px] items-center">
          {/* Form Section */}
          <form
            className="p-10 flex flex-col justify-center w-full max-w-md mx-auto"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-7 w-full">
              {/* GitHub OAuth Button */}
              {mode !== 'forgot' && (
                <Button
                  type="button"
                  onClick={handleGitHubSignIn}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#232526] to-[#414345] text-white hover:from-[#333] hover:to-[#555] font-extrabold text-lg py-4 rounded-xl border border-zinc-700 shadow-2xl transition-all duration-200"
                  disabled={loading}
                >
                  <svg
                    width="22"
                    height="22"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="mr-2"
                  >
                    <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.241 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.803 5.624-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </Button>
              )}
              {/* Separator */}
              {mode !== 'forgot' && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/30" />
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    or continue with email
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent dark:via-primary/30" />
                </div>
              )}
              <div className="flex flex-col gap-7 w-full">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-4xl font-extrabold tracking-tight text-primary">
                    {mode === 'login' && 'Welcome back'}
                    {mode === 'register' && 'Create your account'}
                    {mode === 'forgot' && 'Forgot Password'}
                  </h1>
                  <p className="text-muted-foreground text-balance mt-2 text-base">
                    {mode === 'login' && 'Login to your boltX account'}
                    {mode === 'register' && 'Sign up for a boltX account'}
                    {mode === 'forgot' &&
                      'Enter your email to reset your password'}
                  </p>
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="email" className="text-lg font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="rounded-lg border border-primary/20 bg-[#4B5DFE]/20 dark:bg-zinc-900/70"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {mode !== 'forgot' && (
                  <div className="grid gap-4">
                    <div className="flex items-center">
                      <Label htmlFor="password" className="text-lg font-medium">
                        Password
                      </Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          className="ml-auto text-sm underline-offset-2 hover:underline text-primary"
                          onClick={() => setMode('forgot')}
                        >
                          Forgot your password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      className="rounded-lg border border-primary/20 bg-[#4B5DFE]/20 dark:bg-zinc-900/70"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {mode === 'login' && 'Login'}
                  {mode === 'register' && 'Sign Up'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </Button>
                <div className="text-center text-sm">
                  {mode === 'login' && (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        className="underline underline-offset-4 text-primary font-semibold"
                        onClick={() => {
                          setMode('register');
                          setPassword('');
                        }}
                      >
                        Sign up
                      </button>
                    </>
                  )}
                  {mode === 'register' && (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="underline underline-offset-4 text-primary font-semibold"
                        onClick={() => {
                          setMode('login');
                          setPassword('');
                        }}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                  {mode === 'forgot' && (
                    <>
                      Remembered your password?{' '}
                      <button
                        type="button"
                        className="underline underline-offset-4 text-primary font-semibold"
                        onClick={() => setMode('login')}
                      >
                        Back to login
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
          {/* Separator */}
          <div className="hidden md:flex items-center justify-center h-full">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent dark:via-primary/30 rounded-full mx-4" />
          </div>
          {/* Logo Section */}
          <div className="flex items-center justify-center size-full bg-transparent p-8">
            <Image
              src="/images/dark.svg"
              alt="App Logo"
              width={208}
              height={208}
              className="size-52 object-contain drop-shadow-xl"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 mt-4">
        By clicking continue, you agree to our{' '}
        <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  );
}
