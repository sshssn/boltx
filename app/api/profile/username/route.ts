import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    console.log('Username API GET - Session:', session?.user?.id);

    if (!session?.user) {
      console.log('Username API GET - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRecord = await db
      .select({
        username: user.username,
        lastUsernameChange: user.lastUsernameChange,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    console.log('Username API GET - User record:', userRecord);

    if (userRecord.length === 0) {
      console.log('Username API GET - User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = {
      username: userRecord[0].username,
      lastChange: userRecord[0].lastUsernameChange,
    };

    console.log('Username API GET - Response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Username API GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log('Username API POST - Session:', session?.user?.id);

    if (!session?.user) {
      console.log('Username API POST - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username } = body;
    console.log('Username API POST - Requested username:', username);

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

    // Get current user data to check cooldown
    const currentUser = await db
      .select({ lastUsernameChange: user.lastUsernameChange })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check cooldown (30 days)
    if (currentUser[0].lastUsernameChange) {
      const lastChange = new Date(currentUser[0].lastUsernameChange);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (lastChange > thirtyDaysAgo) {
        const daysRemaining = Math.ceil(
          (lastChange.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) /
            (24 * 60 * 60 * 1000),
        );
        return NextResponse.json(
          {
            error: `You can only change your username once per month. Please wait ${daysRemaining} more days.`,
            daysRemaining,
          },
          { status: 400 },
        );
      }
    }

    // Check uniqueness
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.username, username));

    if (existing.length > 0 && existing[0].id !== session.user.id) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 },
      );
    }

    // Update username and lastUsernameChange timestamp
    await db
      .update(user)
      .set({
        username,
        lastUsernameChange: new Date(),
      })
      .where(eq(user.id, session.user.id));

    console.log(
      'Username API POST - Successfully updated username to:',
      username,
    );
    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error('Username API POST - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
