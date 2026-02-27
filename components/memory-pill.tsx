import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface MemoryItem {
  id: string;
  content: string;
}

const MEMORY_CAP = 20;

export function MemoryPill() {
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFull, setIsFull] = useState(false);

  async function fetchMemory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/memory');
      if (!res.ok) throw new Error('Failed to fetch memory');
      const data = await res.json();
      setMemory(data.memory || []);
      setIsFull((data.memory?.length || 0) >= MEMORY_CAP);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete memory');
      setMemory((prev) => {
        const updated = prev.filter((m) => m.id !== id);
        setIsFull(updated.length >= MEMORY_CAP);
        return updated;
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    fetchMemory();
  }, []);

  if (loading) return null;
  if (error)
    return (
      <div className="bg-red-100 text-red-700 rounded-xl px-4 py-2 text-xs">
        {error}
      </div>
    );
  if (!memory.length) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap gap-2 justify-center items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl px-4 py-2 shadow-md border border-zinc-200 dark:border-zinc-700 max-w-2xl">
        {memory.map((item) => (
          <span
            key={item.id}
            className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 mr-1 mb-1"
          >
            {item.content}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-2 p-0.5 text-xs text-zinc-400 hover:text-red-500"
              onClick={() => handleDelete(item.id)}
              aria-label="Delete memory"
            >
              ×
            </Button>
          </span>
        ))}
        {isFull && (
          <span className="ml-2 px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
            Memory limit reached
          </span>
        )}
      </div>
    </div>
  );
}
