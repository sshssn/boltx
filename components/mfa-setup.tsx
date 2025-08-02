'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Shield, QrCode, Key } from 'lucide-react';

interface MFASetupProps {
  onSetupComplete: () => void;
}

export function MFASetup({ onSetupComplete }: MFASetupProps) {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'complete'>(
    'initial',
  );
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSetupMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup MFA');
      }

      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mfa/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify token');
      }

      setSuccess('MFA enabled successfully!');
      setStep('complete');
      setTimeout(() => {
        onSetupComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'initial') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Setup Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Enhance your admin account security with TOTP-based two-factor
            authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You'll need an authenticator app like Google Authenticator,
                Authy, or 1Password.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSetupMFA}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Setup MFA'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'qr') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app to add your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="border rounded-lg" />
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Backup Codes</h4>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure location. You can use them
                to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code) => (
                  <Badge key={code} variant="secondary" className="font-mono">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Enter the 6-digit code from your authenticator app
              </label>
              <Input
                id="token"
                type="text"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
                className="font-mono text-center text-lg"
              />
            </div>

            <Button
              onClick={handleVerifyToken}
              disabled={loading || token.length !== 6}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Enable MFA'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            MFA Enabled Successfully!
          </CardTitle>
          <CardDescription>
            Your admin account is now protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You'll need to enter a 6-digit code from your authenticator app
              every time you log in to the admin dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}
