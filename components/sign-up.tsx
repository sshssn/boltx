import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { LogoIcon } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import zxcvbn from 'zxcvbn';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    const result = zxcvbn(value);
    setPasswordScore(result.score);
    setPasswordFeedback(
      result.feedback.suggestions.join(' ') || result.feedback.warning || '',
    );
  };

  const isPasswordStrong = passwordScore >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUsernameError('');
    if (!username.trim()) {
      setUsernameError('Username is required.');
      setLoading(false);
      return;
    }
    // TODO: Add async uniqueness check here
    if (!isPasswordStrong) {
      setError('Please choose a stronger password.');
      setLoading(false);
      return;
    }
    // You should call your registration API here, then sign in
    // For now, just try signIn
    const res = await signIn('credentials', {
      username, // Pass username
      email,
      password,
      redirect: true,
      callbackUrl: '/chat',
    });
    if (res?.error) setError('Registration failed');
    setLoading(false);
  };

  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
      >
        <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
          <div className="text-center">
            <Link href="/" aria-label="go home" className="mx-auto block w-fit">
              <LogoIcon />
            </Link>
            <h1 className="text-title mb-1 mt-4 text-xl font-semibold">
              Create an Account
            </h1>
            <p className="text-sm">Welcome! Create an account to get started</p>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="block text-sm">
                Username
              </Label>
              <Input
                type="text"
                required
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => {
                  // TODO: Add async uniqueness check here
                  if (!username.trim())
                    setUsernameError('Username is required.');
                  else setUsernameError('');
                }}
                autoComplete="username"
                placeholder="yourname"
              />
              <div className="text-xs text-zinc-400 min-h-[1.5em]">
                Choose a unique username. This helps the AI address you
                personally and improves your chat experience.
              </div>
              {usernameError && (
                <div className="text-red-500 text-sm">{usernameError}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-title text-sm">
                  Password
                </Label>
                <Button asChild variant="link" size="sm">
                  <Link
                    href="#"
                    className="link intent-info variant-ghost text-sm"
                  >
                    Forgot your Password ?
                  </Link>
                </Button>
              </div>
              <Input
                type="password"
                required
                name="pwd"
                id="pwd"
                className="input sz-md variant-mixed"
                value={password}
                onChange={handlePasswordChange}
              />
              <div className="mt-2">
                <div className="w-full h-2 rounded bg-zinc-800 overflow-hidden">
                  <div
                    className={
                      passwordScore === 0
                        ? 'bg-red-500'
                        : passwordScore === 1
                          ? 'bg-orange-500'
                          : passwordScore === 2
                            ? 'bg-yellow-500'
                            : passwordScore === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                    }
                    style={{
                      width: `${(passwordScore + 1) * 20}%`,
                      height: '100%',
                    }}
                  />
                </div>
                <div className="text-xs mt-1 text-zinc-400 min-h-[1.5em]">
                  {password &&
                    (passwordScore < 3
                      ? passwordFeedback || 'Password is too weak.'
                      : 'Strong password!')}
                </div>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </div>

          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <hr className="border-dashed" />
            <span className="text-muted-foreground text-xs">
              Or continue With
            </span>
            <hr className="border-dashed" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/chat' })}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285f4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                ></path>
                <path
                  fill="#34a853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                ></path>
                <path
                  fill="#fbbc05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                ></path>
                <path
                  fill="#eb4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                ></path>
              </svg>
              <span>Google</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => signIn('microsoft', { callbackUrl: '/chat' })}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 256 256"
              >
                <path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"></path>
                <path fill="#80cc28" d="M256 121.666H134.335V0H256z"></path>
                <path
                  fill="#00adef"
                  d="M121.663 256.002H0V134.336h121.663z"
                ></path>
                <path
                  fill="#fbbc09"
                  d="M256 256.002H134.335V134.336H256z"
                ></path>
              </svg>
              <span>Microsoft</span>
            </Button>
          </div>
        </div>
        <div className="p-3">
          <p className="text-accent-foreground text-center text-sm">
            Have an account ?
            <Button asChild variant="link" className="px-2">
              <Link href="/auth">Sign In</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
