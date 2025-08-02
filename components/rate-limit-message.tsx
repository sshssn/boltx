'use client';

import { useMessageLimit } from './message-limit-provider';
import { Card, CardContent } from './ui/card';
import { AlertTriangle } from 'lucide-react';

interface RateLimitMessageProps {
  isVisible: boolean;
}

export function RateLimitMessage({ isVisible }: RateLimitMessageProps) {
  let getRateLimitMessage = () => '';
  try {
    const messageLimitData = useMessageLimit();
    getRateLimitMessage = messageLimitData.getRateLimitMessage;
  } catch (error) {
    // MessageLimitProvider not available (e.g., for admin users)
    return null;
  }

  if (!isVisible) return null;

  const message = getRateLimitMessage();
  const lines = message.split('\n');

  return (
    <div className="flex justify-center w-full px-4 mb-4">
      <Card className="w-full max-w-2xl bg-red-50/90 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/80 dark:border-red-800/60 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 space-y-2">
              {lines.map((line, index) => (
                <p
                  key={index}
                  className={`text-sm ${
                    index === 0
                      ? 'font-medium text-red-900 dark:text-red-100'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 