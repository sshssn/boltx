import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import ClientAccountDashboard from './ClientAccountDashboard';

export default async function AccountPage() {
  const session = await auth();
  
  // Redirect admin users to admin dashboard
  if (session?.user?.type === 'admin') {
    redirect('/admin');
  }
  
  // Redirect guest users to auth page
  if (session?.user?.type === 'guest') {
    redirect('/auth');
  }
  
  return <ClientAccountDashboard />;
}
