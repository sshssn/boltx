import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareIcon } from 'lucide-react';

export default function MessagesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <MessageSquareIcon className="size-6" />
        <CardTitle>Messages</CardTitle>
      </CardHeader>
    </Card>
  );
}
