import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Debug logging for admin layout
  console.log('Admin layout - Session check:', {
    hasSession: !!session,
    userRole: session?.user?.role,
    userType: session?.user?.type,
    userEmail: session?.user?.email,
  });

  // Check if user is authenticated and is admin
  if (!session || session.user.role !== 'admin') {
    console.log('Admin layout - Access denied, redirecting to auth');
    redirect('/auth');
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-background">{children}</div>
    </SessionProvider>
  );
}
