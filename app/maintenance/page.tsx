'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MaintenancePage() {
  const [maintenanceData, setMaintenanceData] = useState<{
    message: string;
    duration: string;
  } | null>(null);

  useEffect(() => {
    // Fetch maintenance data
    fetch('/api/admin/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data.maintenanceMode) {
          setMaintenanceData({
            message: data.message || 'We are currently performing maintenance to improve your experience.',
            duration: data.duration || 'We will be back shortly.'
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-background dark:via-background/95 dark:to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="bg-white/90 dark:bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Wrench className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Under Maintenance</CardTitle>
            <CardDescription>
              We&apos;re working hard to improve your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{maintenanceData?.duration || 'We will be back shortly.'}</span>
            </div>
            
            {maintenanceData?.message && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {maintenanceData.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Please check back later</span>
            </div>

            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 