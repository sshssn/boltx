'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';
import { showLoginToast } from '@/components/auth-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, User, Mail, Lock, Zap, Check, X } from 'lucide-react';
import zxcvbn from 'zxcvbn';

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
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameValidating, setUsernameValidating] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Handle URL parameters for mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'signup') {
      setMode('register');
    }
  }, []);

  // Username validation
  useEffect(() => {
    if (mode === 'register' && username.length >= 3) {
      const validateUsername = async () => {
        setUsernameValidating(true);
        try {
          const response = await fetch('/api/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
          const data = await response.json();
          setUsernameAvailable(data.available);
        } catch (error) {
          setUsernameAvailable(null);
        }
        setUsernameValidating(false);
      };

      const timeoutId = setTimeout(validateUsername, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, mode]);

  // Password strength checker
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (mode === 'register') {
      const result = zxcvbn(value);
      setPasswordScore(result.score);
      setPasswordFeedback(
        result.feedback.suggestions.join(' ') || result.feedback.warning || '',
      );
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // Password strength validation for register mode
    if (mode === 'register') {
      if (passwordScore < 3) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'Password must be at least "Fair" strength. Please choose a stronger password.',
        });
        setLoading(false);
        return;
      }
      if (usernameAvailable !== true) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please choose a unique username.',
        });
        setLoading(false);
        return;
      }
    }

    if (mode === 'login') {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const res = await import('@/app/(auth)/actions').then((m) =>
        m.login({ status: 'idle' }, formData),
      );
      setLoading(false);
      if (res.status === 'success') {
        showLoginToast();
        // Use router.push instead of window.location.href to prevent loops
        router.push('/');
      } else if (res.status === 'invalid_data') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid credentials.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Login failed.',
        });
      }
    } else if (mode === 'register') {
      if (!validateEmail(email)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a valid email.',
        });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Password must be at least 6 characters.',
        });
        setLoading(false);
        return;
      }
      if (username.length < 3) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Username must be at least 3 characters.',
        });
        setLoading(false);
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'Username can only contain letters, numbers, underscores, and hyphens.',
        });
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      if (username) {
        formData.append('username', username);
      }
      const res = await import('@/app/(auth)/actions').then((m) =>
        m.register({ status: 'idle' }, formData),
      );
      setLoading(false);
      if (res.status === 'success') {
        showLoginToast();
        window.location.href = '/';
      } else if (res.status === 'user_exists') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Account already exists.',
        });
      } else if (res.status === 'invalid_data') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid registration data.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Registration failed.',
        });
      }
    } else if (mode === 'forgot') {
      if (!validateEmail(email)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a valid email.',
        });
        setLoading(false);
        return;
      }
      setTimeout(() => {
        toast({
          variant: 'success',
          title: 'Success!',
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
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'GitHub authentication failed.',
        });
      } else {
        // OAuth redirects automatically, so we don't need to show toast here
        // The toast will be shown when the user returns to the app
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'GitHub authentication failed.',
      });
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const res = await signIn('google', { callbackUrl: '/' });
      if (res?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Google authentication failed.',
        });
      } else {
        // OAuth redirects automatically, so we don't need to show toast here
        // The toast will be shown when the user returns to the app
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Google authentication failed.',
      });
    }
    setLoading(false);
  }

  return (
    <div
      className={cn(
        'min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden',
        className,
      )}
      {...props}
    >
      {/* Beautiful Abstract Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2029&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80" />
      </div>
      {/* Back to Chat Button */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <Link href="/">
          <button
            type="button"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium shadow-lg border border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-105"
          >
            ← Back to Chat
          </button>
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg">
        {/* Auth Form Card */}
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-zinc-700/50 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl p-6 md:p-8 relative z-10">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <Image
              src="/images/dark.svg"
              alt="BoltX"
              width={120}
              height={40}
              className="h-8 w-auto mx-auto mb-4"
            />
            <div className="w-full border-t border-zinc-200/60 dark:border-zinc-600/60 mb-6" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">
              {mode === 'login' && 'Sign in to your account to continue'}
              {mode === 'register' && 'Create your account to get started'}
              {mode === 'forgot' && 'Enter your email to reset your password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OAuth Sign In Buttons */}
            {(mode === 'login' || mode === 'register') && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGitHubSignIn}
                  className="bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/50 font-medium py-3 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  <svg className="mr-2 size-4" viewBox="0 0 24 24">
                    <path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      fill="currentColor"
                    />
                  </svg>
                  GitHub
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/50 font-medium py-3 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  <svg className="mr-2 size-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </div>
            )}

            {/* Divider */}
            {(mode === 'login' || mode === 'register') && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-300 dark:border-zinc-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/90 dark:bg-zinc-900/90 px-2 text-zinc-500 dark:text-zinc-400">
                    Or continue with
                  </span>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2  -translate-y-1/2 size-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/60 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-zinc-300/80 dark:focus:border-zinc-600/80 focus:ring-0"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2  -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder=""
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="px-10 bg-white/60 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-zinc-300/80 dark:focus:border-zinc-600/80 focus:ring-0"
                    />
                    {usernameValidating && (
                      <div className="absolute right-3 top-1/2  -translate-y-1/2">
                        <div className="animate-spin rounded-full size-4 border-b-2 border-zinc-400" />
                      </div>
                    )}
                    {!usernameValidating && username.length >= 3 && (
                      <div className="absolute right-3 top-1/2  -translate-y-1/2">
                        {usernameAvailable === true ? (
                          <Check className="size-4 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <X className="size-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {username.length >= 3 && !usernameValidating && (
                    <p
                      className={cn(
                        'text-xs',
                        usernameAvailable === true
                          ? 'text-green-600 dark:text-green-400'
                          : usernameAvailable === false
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-zinc-500 dark:text-zinc-400',
                      )}
                    >
                      {usernameAvailable === true
                        ? 'Username is available'
                        : usernameAvailable === false
                          ? 'Username is already taken'
                          : 'Checking availability...'}
                    </p>
                  )}
                </div>
              )}

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Password
                    </Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 underline decoration-1 underline-offset-2 hover:decoration-2 transition-all duration-200"
                        onClick={() => setMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2  -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      className="px-10 bg-white/60 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-900 dark:text-white focus:border-zinc-300/80 dark:focus:border-zinc-600/80 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2  -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {mode === 'register' && password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Password strength:
                        </span>
                        <span
                          className={cn(
                            'font-medium',
                            passwordScore <= 1
                              ? 'text-red-600 dark:text-red-400'
                              : passwordScore === 2
                                ? 'text-orange-600 dark:text-orange-400'
                                : passwordScore === 3
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400',
                          )}
                        >
                          {getPasswordStrengthText(passwordScore)}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {[0, 1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-all duration-300',
                              level <= passwordScore
                                ? getPasswordStrengthColor(level)
                                : 'bg-zinc-200 dark:bg-zinc-700',
                            )}
                          />
                        ))}
                      </div>
                      {passwordFeedback && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {passwordFeedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-sm"
                disabled={
                  loading ||
                  (mode === 'register' &&
                    (passwordScore < 3 || usernameAvailable !== true))
                }
              >
                {loading ? (
                  <div className="animate-spin rounded-full size-4 border-b-2 border-white" />
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </Button>
            </div>

            {/* Mode Switch Links */}
            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              {mode === 'login' && (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 underline decoration-2 underline-offset-4 font-medium transition-colors duration-200"
                    onClick={() => {
                      setMode('register');
                      setPassword('');
                      setUsername('');
                      setPasswordScore(0);
                      setPasswordFeedback('');
                      setUsernameAvailable(null);
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
                    className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 underline decoration-2 underline-offset-4 font-medium transition-colors duration-200"
                    onClick={() => {
                      setMode('login');
                      setPassword('');
                      setUsername('');
                      setPasswordScore(0);
                      setPasswordFeedback('');
                      setUsernameAvailable(null);
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
                    className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-zinc-400 underline decoration-2 underline-offset-4 font-medium transition-colors duration-200"
                    onClick={() => setMode('login')}
                  >
                    Back to login
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            By clicking continue, you agree to our{' '}
            <Link
              href="/terms"
              className="underline decoration-2 underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200 font-medium"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline decoration-2 underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200 font-medium"
            >
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
