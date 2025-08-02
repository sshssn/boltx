'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
          setErrorDetails(
            'There is a problem with the server configuration. Please contact support.',
          );
          break;
        case 'AccessDenied':
          setErrorDetails(
            'You do not have permission to sign in. Please check your credentials.',
          );
          break;
        case 'Verification':
          setErrorDetails(
            'The verification link has expired or has already been used.',
          );
          break;
        case 'Default':
          setErrorDetails(
            'An unexpected error occurred during authentication.',
          );
          break;
        case 'OAuthSignin':
          setErrorDetails('Error occurred during OAuth sign in process.');
          break;
        case 'OAuthCallback':
          setErrorDetails('Error occurred during OAuth callback process.');
          break;
        case 'OAuthCreateAccount':
          setErrorDetails(
            'Could not create OAuth provider user in the database.',
          );
          break;
        case 'EmailCreateAccount':
          setErrorDetails(
            'Could not create email provider user in the database.',
          );
          break;
        case 'Callback':
          setErrorDetails('Error occurred during callback process.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorDetails(
            'Email on the account already exists with different provider.',
          );
          break;
        case 'EmailSignin':
          setErrorDetails('Check your email address.');
          break;
        case 'CredentialsSignin':
          setErrorDetails(
            'Sign in failed. Check the details you provided are correct.',
          );
          break;
        case 'SessionRequired':
          setErrorDetails('Please sign in to access this page.');
          break;
        default:
          setErrorDetails('An unexpected error occurred. Please try again.');
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
        <Card className="border shadow-lg">
          <CardContent className="p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="size-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="size-6 text-white" />
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Authentication Error
              </h1>
              {error && (
                <p className="text-sm text-muted-foreground">
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
              >
                <RefreshCw className="size-4 mr-2" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="size-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Help Section */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Need help?
                </p>
                <div className="flex justify-center gap-4 text-xs">
                  <Link
                    href="/support"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Contact Support
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
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
