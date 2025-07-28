import Form from 'next/form';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  mode = 'signin', // 'signin' or 'signup'
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
  return (
    <div className="w-full max-w-md mx-auto">
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
      <div className="relative">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-white/80 dark:from-zinc-900/80 dark:via-zinc-800/40 dark:to-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-zinc-700/50 shadow-2xl" />

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10 rounded-2xl" />

        <Form action={action} className="relative p-8 space-y-6">
          {/* Username field - only for signup */}
          {mode === 'signup' && (
            <div className="space-y-3 group">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
              >
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  className="w-full px-4 py-3 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
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
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-200 pointer-events-none group-focus-within:opacity-20" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                3-32 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-3 group">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
            >
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                className="w-full px-4 py-3 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus={mode === 'signin'}
                defaultValue={defaultEmail}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-200 pointer-events-none group-focus-within:opacity-20" />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-3 group">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                className="w-full px-4 py-3 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                type="password"
                placeholder="••••••••"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-200 pointer-events-none group-focus-within:opacity-20" />
            </div>
          </div>

          {/* Form actions */}
          <div className="pt-2">{children}</div>
        </Form>
      </div>
    </div>
  );
}
