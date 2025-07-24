import { useRouter } from 'next/navigation';
import { InfoIcon } from './icons';
import { useEffect, useState } from 'react';

export function MemoryPill() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('memoryPillPopupShown')) {
      setShowPopup(true);
      sessionStorage.setItem('memoryPillPopupShown', '1');
      setTimeout(() => setShowPopup(false), 3500);
    }
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700 shadow-sm transition text-sm font-medium"
        onClick={() => router.push('/account?tab=memories')}
        style={{ minWidth: 0 }}
      >
        <span>Memories</span>
        <InfoIcon size={16} />
      </button>
      {showPopup && (
        <div className="absolute left-1/2 -translate-x-1/2 top-10 bg-zinc-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 animate-fade-in">
          Save facts, reminders, and more! Click to view your memories.
        </div>
      )}
    </div>
  );
}
