import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMessageCountByUserId } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { ChatSDKError } from '@/lib/errors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { message } from '@/lib/db/schema';
import { and, eq, gte } from 'drizzle-orm';

if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is not set');
const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

// Pseudo-logic for bonus: Assume we have a way to check if user upgraded from guest today and how many guest tokens they used
async function getBonusTokens(userId: string, userType: string) {
  // This is a placeholder. In a real implementation, you would check a field in the user table or a log.
  // For now, always return 0 (no bonus). Replace with real logic if you add a migration.
  return 0;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    // Allow guests to get quota info
    return NextResponse.json({
      tokensUsed: 0,
      messagesLimit: 20,
    });
  }

  const userType = session.user.type || 'guest';
  const messagesLimit =
    entitlementsByUserType[userType]?.maxMessagesPerDay || 20;
  const tokensUsed = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 24,
  });
  let bonus = 0;
  if (userType === 'regular') {
    bonus = await getBonusTokens(session.user.id, userType);
  }
  return NextResponse.json({
    tokensUsed,
    messagesLimit: messagesLimit + bonus,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:api').toResponse();
  }

  try {
    const { increment } = await request.json();

    if (increment) {
      // Get current count from database
      const currentCount = await getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: 24,
      });

      // The actual increment happens in the chat route when messages are saved
      // This endpoint just returns the current count for UI updates
      const userType = session.user.type || 'guest';
      const messagesLimit =
        entitlementsByUserType[userType]?.maxMessagesPerDay || 20;

      return NextResponse.json({
        tokensUsed: currentCount,
        messagesLimit,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling message count:', error);
    return new ChatSDKError(
      'bad_request:api',
      'Failed to handle message count',
    ).toResponse();
  }
}
