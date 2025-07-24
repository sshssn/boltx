import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCardIcon } from 'lucide-react';

export default function BillingPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <CreditCardIcon className="h-6 w-6" />
        <CardTitle>Billing</CardTitle>
      </CardHeader>
    </Card>
  );
}
