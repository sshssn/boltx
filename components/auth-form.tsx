import Form from 'next/form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

// Email validation for major providers
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'microsoft.com',
];

const validateEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  mode = 'signin',
  title,
  subtitle,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  mode?: 'signin' | 'signup';
  title?: string;
  subtitle?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) {
      setEmailError(
        'Please use a supported email provider (Gmail, iCloud, Yahoo, Microsoft)',
      );
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Header Section */}
      {(title || subtitle) && (
        <div className="text-center mb-8 space-y-2">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-zinc-700/50 shadow-2xl p-8">
        <Form action={action} className="space-y-6">
          {/* Username field - only for signup */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Username
              </Label>
              <Input
                id="username"
                name="username"
                className="w-full"
                type="text"
                placeholder="johndoe"
                autoComplete="username"
                required
                autoFocus={mode === 'signup'}
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9_-]+"
                title="Username must be 3-32 characters, letters, numbers, underscores, and hyphens only"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                3-32 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              className={`w-full ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus={mode === 'signin'}
              defaultValue={defaultEmail}
              onChange={handleEmailChange}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              title="Please enter a valid email address from a supported provider"
            />
            {emailError && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {emailError}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Supported providers: Gmail, iCloud, Yahoo, Microsoft
            </p>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                className="w-full pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-zinc-500" />
                ) : (
                  <Eye className="w-4 h-4 text-zinc-500" />
                )}
              </button>
            </div>
          </div>

          {/* Form actions */}
          <div className="pt-2">{children}</div>

          {/* Reset password link - only for signin mode */}
          {mode === 'signin' && (
            <div className="text-center pt-2">
              <a
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}
