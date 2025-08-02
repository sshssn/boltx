'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);

      // Map error codes to user-friendly messages
      switch (errorParam) {
        case 'Configuration':
          setErrorDetails('Server configuration issue. Contact support.');
          break;
        case 'AccessDenied':
          setErrorDetails('Permission denied. Check your credentials.');
          break;
        case 'Verification':
          setErrorDetails('Verification link expired or already used.');
          break;
        case 'Default':
          setErrorDetails('Unexpected authentication error.');
          break;
        case 'OAuthSignin':
          setErrorDetails('OAuth sign in error.');
          break;
        case 'OAuthCallback':
          setErrorDetails('OAuth callback error.');
          break;
        case 'OAuthCreateAccount':
          setErrorDetails('Could not create OAuth account.');
          break;
        case 'EmailCreateAccount':
          setErrorDetails('Could not create email account.');
          break;
        case 'Callback':
          setErrorDetails('Callback process error.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorDetails('Email exists with different provider.');
          break;
        case 'EmailSignin':
          setErrorDetails('Check your email address.');
          break;
        case 'CredentialsSignin':
          setErrorDetails('Sign in failed. Check your details.');
          break;
        case 'SessionRequired':
          setErrorDetails('Please sign in to access this page.');
          break;
        default:
          setErrorDetails('An unexpected error occurred.');
      }
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="border rounded-lg shadow-sm bg-card p-6">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <div className="size-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="size-5 text-white" />
            </div>
          </div>

          {/* Error Title */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Authentication Error
            </h1>
            {error && (
              <p className="text-xs text-muted-foreground">
                Error: {error}
              </p>
            )}
          </div>

          {/* Error Details */}
          <div className="mb-6">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 text-center">
                {errorDetails}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="sm"
            >
              <RefreshCw className="size-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
              size="sm"
            >
              <Home className="size-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Need help?
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <Link
                  href="/support"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Support
                </Link>
                <Link
                  href="/faq"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
