'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerDashboardOverlaySetter } from '@/hooks/use-dashboard-overlay';
import { Button } from '@/components/ui/button';

export function DashboardOverlay({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerDashboardOverlaySetter(setOpen);
    return () => registerDashboardOverlaySetter(() => {});
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
        >
          <motion.div
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            exit={{ x: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="size-full bg-background shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Back to Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
