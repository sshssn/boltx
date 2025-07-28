import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { stripe, syncStripeDataToDB } from '@/lib/stripe';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (sessionId) {
      // Verify the checkout session
      const checkoutSession =
        await stripe.checkout.sessions.retrieve(sessionId);
      if (
        checkoutSession.customer &&
        typeof checkoutSession.customer === 'string'
      ) {
        // Update user's Stripe customer ID if not set
        const userRecord = await db
          .select()
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);
        if (userRecord.length && !userRecord[0].stripeCustomerId) {
          await db
            .update(user)
            .set({ stripeCustomerId: checkoutSession.customer })
            .where(eq(user.id, session.user.id));
        }
      }
    }

    // Sync subscription data
    const result = await syncStripeDataToDB(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription data' },
      { status: 500 },
    );
  }
}
