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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';

interface MFAVerifyProps {
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerify({ onVerificationSuccess, onCancel }: MFAVerifyProps) {
  const [activeTab, setActiveTab] = useState<'token' | 'backup'>('token');
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleVerify = async () => {
    const isTokenTab = activeTab === 'token';
    const value = isTokenTab ? token : backupCode;

    if (!value.trim()) {
      setError(`Please enter a ${isTokenTab ? 'token' : 'backup code'}`);
      return;
    }

    if (isTokenTab && value.length !== 6) {
      setError('Token must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const body = isTokenTab
        ? { token: value.trim() }
        : { backupCode: value.trim() };

      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      onVerificationSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication Required
        </CardTitle>
        <CardDescription>
          Please verify your identity to access the admin dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'token' | 'backup')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token">Authenticator App</TabsTrigger>
            <TabsTrigger value="backup">Backup Code</TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Use one of your backup codes to access your account. Each code
                can only be used once.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label htmlFor="backupCode" className="text-sm font-medium">
                Enter your backup code
              </label>
              <Input
                id="backupCode"
                type="text"
                placeholder="ABCDEF"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="font-mono text-center text-lg"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleVerify}
            disabled={loading || (!token.trim() && !backupCode.trim())}
            className="flex-1"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
