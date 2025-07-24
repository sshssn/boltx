import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// WARNING: This is a placeholder. You should add an 'apiKey' field to the user table in schema and migrations for production use.

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Placeholder: return a fake key or null
  return NextResponse.json({ apiKey: null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
  }
  // Placeholder: do nothing
  return NextResponse.json({ success: true });
}
