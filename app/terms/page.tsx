'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function TermsOfService() {
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
        <h1 className="text-2xl font-bold mb-3">Terms of Service</h1>
        <p className="mb-3 font-semibold">1. Acceptance</p>
        <p className="mb-3">
          By using this platform, you agree to these terms. If you do not agree,
          do not use the service.
        </p>
        <p className="mb-3 font-semibold">2. User Conduct</p>
        <p className="mb-3">
          You agree not to misuse the platform or violate any laws.
        </p>
        <p className="mb-3 font-semibold">3. Intellectual Property</p>
        <p className="mb-3">
          All content is owned by EcommerceFusion LLC or its licensors. Do not
          copy or redistribute without permission.
        </p>
        <p className="mb-3 font-semibold">4. Disclaimer</p>
        <p className="mb-3">
          The platform is provided &quot;as is&quot; without warranties. We are
          not liable for any damages.
        </p>
        <p className="mb-1 font-semibold">5. Contact</p>
        <p className="mb-1">
          For questions, contact legal@ecommercefusion.com.
        </p>
      </div>
    </div>
  );
}
