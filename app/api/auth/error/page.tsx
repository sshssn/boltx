'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a] p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-500/10 to-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <Card className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl backdrop-saturate-150 border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xl shadow-black/10 dark:shadow-black/30">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/images/dark.svg"
                alt="BoltX"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            {/* Error Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-4"
            >
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Authentication Error
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {error && `Error: ${error}`}
              </p>
            </motion.div>

            {/* Error Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 text-center">
                  {errorDetails}
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700"
            >
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Shield className="w-4 h-4" />
                  <span>Need help?</span>
                </div>
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
            </motion.div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute -top-16 left-0"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-zinc-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
