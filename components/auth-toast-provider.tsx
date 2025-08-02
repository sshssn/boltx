'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthToast } from './auth-toast';

interface AuthToastContextType {
  showLoginToast: () => void;
  showLogoutToast: () => void;
}

const AuthToastContext = createContext<AuthToastContextType | undefined>(undefined);

export function useAuthToast() {
  const context = useContext(AuthToastContext);
  if (!context) {
    throw new Error('useAuthToast must be used within an AuthToastProvider');
  }
  return context;
}

interface AuthToastProviderProps {
  children: ReactNode;
}

export function AuthToastProvider({ children }: AuthToastProviderProps) {
  const [toastState, setToastState] = useState<{
    type: 'login' | 'logout';
    isVisible: boolean;
  }>({
    type: 'login',
    isVisible: false,
  });

  const showLoginToast = () => {
    setToastState({ type: 'login', isVisible: true });
  };

  const showLogoutToast = () => {
    setToastState({ type: 'logout', isVisible: true });
  };

  const hideToast = () => {
    setToastState(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <AuthToastContext.Provider value={{ showLoginToast, showLogoutToast }}>
      {children}
      <AuthToast
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={hideToast}
      />
    </AuthToastContext.Provider>
  );
} 