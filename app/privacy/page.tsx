'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function PrivacyPolicy() {
  const pathname = usePathname();
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2a] via-[#232329] to-[#181c2a] dark:from-[#181c2a] dark:via-[#232329] dark:to-[#181c2a]">
      {/* Back to Chat Button */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <Link href="/">
          <button
            type="button"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium shadow border border-white/20 backdrop-blur-md transition-all"
          >
            ← Back to Chat
          </button>
        </Link>
      </div>
      <div className="flex justify-center mt-6 md:mt-8 mb-4 md:mb-6">
        <Image
          src="/images/dark.svg"
          alt="Logo"
          width={100}
          height={33}
          className="md:w-[120px] md:h-[40px]"
        />
      </div>
      <div className="w-full max-w-2xl p-3 md:p-4 bg-white/10 dark:bg-zinc-900 rounded-xl shadow-lg text-white mx-4 md:mx-0">
        {/* Tab Switcher */}
        <div className="flex gap-1 md:gap-2 mb-4 justify-center">
          <Link href="/faq">
            <button
              type="button"
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-t-lg font-semibold transition-colors border-b-2 text-xs md:text-sm ${pathname === '/faq' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              FAQ
            </button>
          </Link>
          <Link href="/terms">
            <button
              type="button"
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-t-lg font-semibold transition-colors border-b-2 text-xs md:text-sm ${pathname === '/terms' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              Terms
            </button>
          </Link>
          <Link href="/privacy">
            <button
              type="button"
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-t-lg font-semibold transition-colors border-b-2 text-xs md:text-sm ${pathname === '/privacy' ? 'border-indigo-500 bg-zinc-800 text-white' : 'border-transparent bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              Privacy
            </button>
          </Link>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-3">Privacy Policy</h1>
        <p className="mb-3">
          This product is the sole ownership of EcommerceFusion LLC, 30N Gould
          Sheridan Ste R 82801, WY, USA.
        </p>
        <p className="mb-3 font-semibold">1. What We Collect</p>
        <p className="mb-3">
          We collect only your email and preferences needed for your account.
        </p>
        <p className="mb-3 font-semibold">2. How We Use Data</p>
        <p className="mb-3">
          Your data is used for account management and support. We never sell or
          share your data.
        </p>
        <p className="mb-3 font-semibold">3. Security</p>
        <p className="mb-3">
          We use industry-standard security to protect your data.
        </p>
        <p className="mb-3 font-semibold">4. Deletion</p>
        <p className="mb-3">
          You can delete your account and data at any time.
        </p>
        <p className="mb-1 font-semibold">5. Contact</p>
        <p className="mb-1">
          For privacy questions, contact privacy@ecommercefusion.com.
        </p>
      </div>
    </div>
  );
}
