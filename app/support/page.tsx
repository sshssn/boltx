import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircleIcon } from 'lucide-react';

export default function SupportPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <HelpCircleIcon className="size-6" />
        <CardTitle>Support</CardTitle>
      </CardHeader>
    </Card>
  );
}
