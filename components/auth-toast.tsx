'use client';

import { toast } from 'sonner';
import { LogIn, LogOut } from 'lucide-react';

export function showLoginToast() {
  toast.success('Successfully logged in!', {
    icon: <LogIn className="w-4 h-4" />,
    duration: 3000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
    },
  });
}

export function showLogoutToast() {
  toast.success('Successfully logged out!', {
    icon: <LogOut className="w-4 h-4" />,
    duration: 3000,
    position: 'top-center',
    style: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      color: 'white',
      border: 'none',
    },
  });
}
