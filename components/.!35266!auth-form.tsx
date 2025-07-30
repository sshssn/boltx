import Form from 'next/form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
              className="w-full"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus={mode === 'signin'}
              defaultValue={defaultEmail}
            />
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
