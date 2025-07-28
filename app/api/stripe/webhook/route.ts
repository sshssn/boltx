import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, allowedEvents } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );

    // Check if this is an event we care about
    if (!allowedEvents.includes(event.type)) {
      return NextResponse.json({ received: true });
    }

    // Extract customer ID from the event
    const customerId = (event.data.object as any).customer;

    if (typeof customerId !== 'string') {
      console.error('No customer ID in event:', event.type);
      return NextResponse.json({ received: true });
    }

    // Find user by Stripe customer ID and sync their data
    // This would require a database query to find the user
    // For now, we'll just log the event
    console.log(
      'Stripe webhook event:',
      event.type,
      'for customer:',
      customerId,
    );

    // In a real implementation, you would:
    // 1. Find the user by stripeCustomerId
    // 2. Call syncStripeDataToDB with the user ID
    // 3. Update the user's plan status

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }
}
