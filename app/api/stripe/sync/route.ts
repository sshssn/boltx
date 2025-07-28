import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function syncStripeDataToDB(userId: string) {
  try {
    // Get user from database
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!userRecord.length) {
      throw new Error('User not found');
    }

    const currentUser = userRecord[0];
    const stripeCustomerId = currentUser.stripeCustomerId;

    if (!stripeCustomerId) {
      // Update user to Pro plan
      await db
        .update(user)
        .set({
          plan: 'pro',
        })
        .where(eq(user.id, userId));
      return { status: 'pro' };
    }

    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, revert to free plan
      await db
        .update(user)
        .set({
          plan: 'free',
        })
        .where(eq(user.id, userId));
      return { status: 'free' };
    }

    const subscription = subscriptions.data[0];

    // Check if subscription is active
    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      // Update user to Pro plan
      await db
        .update(user)
        .set({
          plan: 'pro',
        })
        .where(eq(user.id, userId));
      return {
        status: 'pro',
        subscriptionId: subscription.id,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      };
    } else {
      // Subscription is not active, revert to free plan
      await db
        .update(user)
        .set({
          plan: 'free',
        })
        .where(eq(user.id, userId));
      return { status: 'free' };
    }
  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    throw error;
  }
}

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
