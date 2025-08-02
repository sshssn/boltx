import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';
import zxcvbn from 'zxcvbn';

// Icons
const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

const GitHubIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
    </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

export const SignInPage: React.FC<{
  heroImageSrc?: string;
  testimonials?: Testimonial[];
}> = ({ heroImageSrc, testimonials = [] }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameValidating, setUsernameValidating] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
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
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Logged in successfully!',
        });
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
      if (!/\S+@\S+\.\S+/.test(email)) {
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
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Account created successfully!',
        });
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
      if (!/\S+@\S+\.\S+/.test(email)) {
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
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {mode === 'login' && 'Sign in to your account to continue'}
              {mode === 'register' && 'Create your account to get started'}
              {mode === 'forgot' && 'Enter your email to reset your password'}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="animate-element animate-delay-250">
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <GlassInputWrapper>
                    <input 
                      name="username" 
                      type="text" 
                      placeholder="Enter your username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                      required
                      minLength={3}
                      maxLength={32}
                      pattern="[a-zA-Z0-9_-]+"
                    />
                  </GlassInputWrapper>
                  {username.length >= 3 && !usernameValidating && (
                    <p className={cn(
                      'text-xs mt-1',
                      usernameAvailable === true
                        ? 'text-green-600 dark:text-green-400'
                        : usernameAvailable === false
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground',
                    )}>
                      {usernameAvailable === true
                        ? 'Username is available'
                        : usernameAvailable === false
                          ? 'Username is already taken'
                          : 'Checking availability...'}
                    </p>
                  )}
                </div>
              )}

              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                    required
                  />
                </GlassInputWrapper>
              </div>

              {mode !== 'forgot' && (
                <div className="animate-element animate-delay-400">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="text-sm text-violet-400 hover:underline transition-colors"
                        onClick={() => setMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input 
                        name="password" 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Enter your password" 
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" 
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                      </button>
                    </div>
                  </GlassInputWrapper>

                  {/* Password Strength Indicator */}
                  {mode === 'register' && password.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Password strength:
                        </span>
                        <span className={cn(
                          'font-medium',
                          passwordScore <= 1
                            ? 'text-red-600 dark:text-red-400'
                            : passwordScore === 2
                              ? 'text-orange-600 dark:text-orange-400'
                              : passwordScore === 3
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400',
                        )}>
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
                                : 'bg-muted',
                            )}
                          />
                        ))}
                      </div>
                      {passwordFeedback && (
                        <p className="text-xs text-muted-foreground">
                          {passwordFeedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit" 
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading ||
                  (mode === 'register' &&
                    (passwordScore < 3 || usernameAvailable !== true))
                }
              >
                {loading ? (
                  <div className="animate-spin rounded-full size-4 border-b-2 border-white mx-auto" />
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </button>
            </form>

            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                  <span className="w-full border-t border-border"></span>
                  <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
                </div>

                <div className="animate-element animate-delay-800 grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGitHubSignIn} 
                    className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <GitHubIcon />
                    GitHub
                  </button>
                  <button 
                    onClick={handleGoogleSignIn} 
                    className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    <GoogleIcon />
                    Google
                  </button>
                </div>
              </>
            )}

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              {mode === 'login' && (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="text-violet-400 hover:underline transition-colors font-medium"
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
                    className="text-violet-400 hover:underline transition-colors font-medium"
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
                    className="text-violet-400 hover:underline transition-colors font-medium"
                    onClick={() => setMode('login')}
                  >
                    Back to login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}; 