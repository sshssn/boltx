import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMessageUsageCount } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { getClientIP } from '@/lib/utils';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

export async function GET(req: NextRequest) {
  const session = await auth();
  const clientIP = getClientIP(req);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let messagesUsed = 0;
  let messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay; // Default guest limit

  if (session?.user) {
    // Logged-in user - use entitlements based on user type
    const userType = session.user.type || 'guest';
    messagesLimit =
      entitlementsByUserType[userType]?.maxMessagesPerDay ||
      entitlementsByUserType.guest.maxMessagesPerDay;

    // Get usage from database
    messagesUsed = await getMessageUsageCount({
      userId: session.user.id,
      date: today,
    });
  } else {
    // Guest user - track by IP
    if (clientIP) {
      messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay;
      messagesUsed = await getMessageUsageCount({
        ipAddress: clientIP,
        date: today,
      });
    }
  }

  return NextResponse.json({
    tokensUsed: messagesUsed,
    messagesLimit,
    remaining: Math.max(0, messagesLimit - messagesUsed),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const clientIP = getClientIP(request);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  if (!session?.user && !clientIP) {
    return new ChatSDKError('unauthorized:api').toResponse();
  }

  try {
    const { increment } = await request.json();

    if (increment) {
      // Get current count from database
      let currentCount = 0;

      if (session?.user) {
        currentCount = await getMessageUsageCount({
          userId: session.user.id,
          date: today,
        });
      } else if (clientIP) {
        currentCount = await getMessageUsageCount({
          ipAddress: clientIP,
          date: today,
        });
      }

      // Get limit based on user type
      let messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay; // Default guest limit
      if (session?.user) {
        const userType = session.user.type || 'guest';
        messagesLimit =
          entitlementsByUserType[userType]?.maxMessagesPerDay ||
          entitlementsByUserType.guest.maxMessagesPerDay;
      } else {
        messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay;
      }

      return NextResponse.json({
        tokensUsed: currentCount,
        messagesLimit,
        remaining: Math.max(0, messagesLimit - currentCount),
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
