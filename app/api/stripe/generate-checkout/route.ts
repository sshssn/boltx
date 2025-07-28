import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/queries';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    if (!userRecord.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userRecord[0];

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = currentUser.stripeCustomerId;

    // Create a new Stripe customer if this user doesn't have one
    if (!stripeCustomerId) {
      const newCustomer = await stripe.customers.create({
        email: currentUser.email,
        metadata: {
          userId: currentUser.id,
        },
      });

      // Store the Stripe customer ID in the database
      await db
        .update(user)
        .set({ stripeCustomerId: newCustomer.id })
        .where(eq(user.id, currentUser.id));

      stripeCustomerId = newCustomer.id;
    }

    // Create checkout session for Pro plan trial ($0 for 1 month)
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Plan Trial',
              description: '1 month free trial of Pro features',
            },
            unit_amount: 0, // $0 for trial
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/account`,
      subscription_data: {
        trial_period_days: 30, // 30-day trial
        metadata: {
          userId: currentUser.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
