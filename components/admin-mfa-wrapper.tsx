'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MFAVerify } from './mfa-verify';
import { MFASetup } from './mfa-setup';

interface AdminMFAWrapperProps {
  children: React.ReactNode;
}

export function AdminMFAWrapper({ children }: AdminMFAWrapperProps) {
  const { data: session } = useSession();
  const [mfaStatus, setMfaStatus] = useState<
    'loading' | 'enabled' | 'disabled' | 'setup'
  >('loading');
  const [showMFA, setShowMFA] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, [session]);

  const checkMFAStatus = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/mfa/verify');
      const data = await response.json();

      if (response.ok) {
        if (data.mfaEnabled) {
          setMfaStatus('enabled');
          setShowMFA(true);
        } else {
          setMfaStatus('disabled');
          setShowSetup(true);
        }
      } else {
        setMfaStatus('disabled');
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setMfaStatus('disabled');
      setShowSetup(true);
    }
  };

  const handleVerificationSuccess = () => {
    setShowMFA(false);
    setMfaStatus('enabled');
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    setMfaStatus('enabled');
    setShowMFA(true);
  };

  const handleCancel = () => {
    // Redirect to home page if user cancels MFA
    window.location.href = '/';
  };

  if (mfaStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading security verification...</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFASetup onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  if (showMFA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MFAVerify
          onVerificationSuccess={handleVerificationSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return children;
}
