import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { ticket, ticketReply, user } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all tickets with user info
    const tickets = await db
      .select({
        id: ticket.id,
        type: ticket.type,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        assignedTo: ticket.assignedTo,
        'user.id': user.id,
        'user.email': user.email,
        'user.username': user.username,
      })
      .from(ticket)
      .leftJoin(user, eq(ticket.userId, user.id))
      .orderBy(desc(ticket.createdAt));

    // Get replies for each ticket
    const ticketsWithReplies = await Promise.all(
      tickets.map(async (ticketData) => {
        const replies = await db
          .select({
            id: ticketReply.id,
            content: ticketReply.content,
            isAdminReply: ticketReply.isAdminReply,
            createdAt: ticketReply.createdAt,
            'user.id': user.id,
            'user.email': user.email,
            'user.username': user.username,
          })
          .from(ticketReply)
          .leftJoin(user, eq(ticketReply.userId, user.id))
          .where(eq(ticketReply.ticketId, ticketData.id))
          .orderBy(asc(ticketReply.createdAt));

        return {
          ...ticketData,
          replies,
        };
      }),
    );

    return NextResponse.json({ tickets: ticketsWithReplies });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
