import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { and, ne, not, like, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get only registered users (not guests) with their basic info
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.role,
        role: user.role,
        messagesSentToday: user.messagesSentToday,
        createdAt: user.lastUsernameChange,
      })
      .from(user)
      .where(and(ne(user.role, 'guest'), not(like(user.email, 'guest-%'))))
      .orderBy(desc(user.lastUsernameChange));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
