'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface NetworkErrorProps {
  onRetry: () => void;
  message?: string;
}

export function NetworkError({
  onRetry,
  message = 'Network error occurred',
}: NetworkErrorProps) {
  return (
    <div className="flex justify-center w-full px-4 mb-4">
      <div className="flex items-center gap-3 bg-red-500/10 dark:bg-red-500/20 backdrop-blur-md border border-red-500/30 shadow-lg rounded-lg text-sm font-medium px-4 py-3 w-auto max-w-md">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-700 dark:text-red-300 font-medium">
            {message}
          </p>
          <p className="text-red-600 dark:text-red-400 text-xs mt-1">
            Please check your connection and try again
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0 border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
}
