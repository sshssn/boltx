import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { user } from '@/lib/db/schema';
import { db } from '@/lib/db';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null; // e.g., "visa", "mastercard"
        last4: string | null; // e.g., "4242"
      } | null;
    }
  | {
      status: 'none';
    };

export const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
];

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
