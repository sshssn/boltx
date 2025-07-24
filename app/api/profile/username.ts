import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { username } = await req.json();
  if (!username || username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
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
  await db.update(user).set({ username }).where(eq(user.id, session.user.id));
  return NextResponse.json({ success: true });
}
