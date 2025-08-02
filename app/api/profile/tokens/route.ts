import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMessageUsageCount } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { getClientIP } from '@/lib/utils';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const clientIP = getClientIP(req);
  const identifier = session?.user?.id || clientIP || 'unknown';

  // Check rate limit
  if (!checkRateLimit(identifier)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        details: 'Too many requests to tokens API',
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let messagesUsed = 0;
  let messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay; // Default guest limit

  if (session?.user) {
    // Logged-in user - use entitlements based on user role
    const userType = session.user.role === 'admin' ? 'admin' : (session.user.type || 'guest');
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
  const identifier = session?.user?.id || clientIP || 'unknown';

  // Check rate limit
  if (!checkRateLimit(identifier)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        details: 'Too many requests to tokens API',
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

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

      // Get limit based on user role
      let messagesLimit = entitlementsByUserType.guest.maxMessagesPerDay; // Default guest limit
      if (session?.user) {
        const userType = session.user.role === 'admin' ? 'admin' : (session.user.type || 'guest');
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
