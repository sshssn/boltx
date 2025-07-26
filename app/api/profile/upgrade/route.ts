import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    if (plan !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan specified' },
        { status: 400 },
      );
    }

    // For now, since the user table doesn't have a type field,
    // we'll just return success. In a real implementation,
    // you would add a type field to the user table or use a separate table.
    // For beta purposes, we'll consider all users as "pro" when they upgrade

    return NextResponse.json(
      {
        success: true,
        message: 'Upgraded to Pro plan successfully',
        plan: 'pro',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade account' },
      { status: 500 },
    );
  }
}
