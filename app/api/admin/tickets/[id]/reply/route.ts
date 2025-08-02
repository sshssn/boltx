import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { ticketReply, ticket } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 },
      );
    }

    // Verify ticket exists
    const ticketExists = await db
      .select({ id: ticket.id })
      .from(ticket)
      .where(eq(ticket.id, params.id))
      .limit(1);

    if (ticketExists.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Add admin reply
    await db.insert(ticketReply).values({
      ticketId: params.id,
      userId: session.user.id,
      content,
      isAdminReply: true,
    });

    // Update ticket status to in_progress if it was open
    await db
      .update(ticket)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(ticket.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding ticket reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
