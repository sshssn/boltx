import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import ClientAccountDashboard from './ClientAccountDashboard';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user || session.user.type !== 'regular') {
    redirect('/auth');
  }
  return <ClientAccountDashboard session={session} />;
}
