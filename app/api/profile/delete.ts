import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await db
    .update(user)
    .set({ deletedAt: new Date() })
    .where(eq(user.id, session.user.id));
  return NextResponse.json({ success: true });
}
