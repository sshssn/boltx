'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function FAQ() {
  const pathname = usePathname();
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a] dark:from-[#181c2a] dark:via-[#232329] dark:to-[#181c2a]">
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
      <div className="flex justify-center mt-8 mb-6">
        <Image src="/images/dark.svg" alt="Logo" width={120} height={40} />
      </div>
      <div className="w-full max-w-2xl p-4 bg-white/10 dark:bg-zinc-900 rounded-xl shadow-lg text-white">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4 justify-center">
          <Link href="/faq">
            <button
              type="button"
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors border-b-2 ${pathname === '/faq' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              FAQ
            </button>
          </Link>
          <Link href="/terms">
            <button
              type="button"
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors border-b-2 ${pathname === '/terms' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              Terms of Service
            </button>
          </Link>
          <Link href="/privacy">
            <button
              type="button"
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors border-b-2 ${pathname === '/privacy' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              Privacy Policy
            </button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="mb-3 font-semibold">Q: Who owns this product?</p>
        <p className="mb-3">
          A: EcommerceFusion LLC, 30N Gould Sheridan Ste R 82801, WY, USA.
        </p>
        <p className="mb-3 font-semibold">Q: Do you sell my data?</p>
        <p className="mb-3">
          A: No. We do not sell or share your data with third parties.
        </p>
        <p className="mb-3 font-semibold">
          Q: What information do you collect?
        </p>
        <p className="mb-3">
          A: Only what&apos;s necessary for account functionality, such as your
          email address.
        </p>
        <p className="mb-3 font-semibold">Q: How do I delete my account?</p>
        <p className="mb-1">
          A: You can delete your account from your profile settings at any time.
        </p>
      </div>
    </div>
  );
}
