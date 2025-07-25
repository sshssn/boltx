import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PlugIcon } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <PlugIcon className="size-6" />
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
    </Card>
  );
}
