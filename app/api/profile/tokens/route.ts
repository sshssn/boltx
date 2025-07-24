import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMessageCountByUserId } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

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
      messagesLimit: 10,
    });
  }
  const userType = session.user.type || 'guest';
  const messagesLimit =
    entitlementsByUserType[userType]?.maxMessagesPerDay || 10;
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
