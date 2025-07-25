'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function NotFound() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <div className="relative min-h-svh w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a]">
      {/* Back to Chat Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow border border-white/20 backdrop-blur-md transition-all"
          >
            ← Back to Chat
          </button>
        </Link>
      </div>
      <div className="w-full flex flex-col items-center justify-center mt-24 mb-8">
        <Image
          src={isDark ? '/images/404-dark.svg' : '/images/404.svg'}
          alt="404 Not Found"
          width={400}
          height={400}
          className="mx-auto"
          priority
        />
      </div>
    </div>
  );
}
