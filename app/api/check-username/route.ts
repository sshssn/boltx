import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || username.length < 3 || username.length > 32) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // Check if username contains only allowed characters
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            'Username can only contain letters, numbers, underscores, and hyphens.',
        },
        { status: 400 },
      );
    }

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    const available = existingUser.length === 0;

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
