'use client';

import ResetPasswordClient from './ResetPasswordClient';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
