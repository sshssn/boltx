import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserById } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = await getUserById(session.user.id);
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      plan: userRecord.plan || 'free',
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user plan' },
      { status: 500 },
    );
  }
}
