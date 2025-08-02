import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { ticket } from '@/lib/db/schema';
import { eq, asc, desc, and, like, or, count } from 'drizzle-orm';
import { generateUUID } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type as string;
    const subject = body.subject as string;
    const description = body.description as string;
    const priority = (body.priority as string) || 'medium';
    const attachments = body.attachments || [];

    if (!type || !['bug', 'feature', 'support'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid ticket type' },
        { status: 400 },
      );
    }

    if (
      !subject ||
      typeof subject !== 'string' ||
      subject.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 },
      );
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 },
      );
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    // Validate attachments format
    if (!Array.isArray(attachments)) {
      return NextResponse.json(
        { error: 'Attachments must be an array' },
        { status: 400 },
      );
    }

    // Validate each attachment
    for (const attachment of attachments) {
      if (!attachment.name || !attachment.url || !attachment.size) {
        return NextResponse.json(
          { error: 'Invalid attachment format' },
          { status: 400 },
        );
      }
    }

    // Create ticket using Drizzle ORM
    const [newTicket] = await db
      .insert(ticket)
      .values({
        id: generateUUID(),
        userId: session.user.id,
        type,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        priority,
        attachments: JSON.stringify(attachments),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      ticket: {
        ...newTicket,
        attachments: JSON.parse(newTicket.attachments || '[]'),
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const priority = searchParams.get('priority') || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(ticket.userId, session.user.id)];

    if (search) {
      conditions.push(
        or(
          like(ticket.subject, `%${search}%`),
          like(ticket.description, `%${search}%`),
        ),
      );
    }

    if (status) {
      conditions.push(eq(ticket.status, status));
    }

    if (type) {
      conditions.push(eq(ticket.type, type));
    }

    if (priority) {
      conditions.push(eq(ticket.priority, priority));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(ticket)
      .where(and(...conditions));

    // Ensure we have a valid count result with proper error handling
    let totalCount = 0;
    try {
      if (
        countResult &&
        countResult.length > 0 &&
        countResult[0] &&
        typeof countResult[0].count === 'number'
      ) {
        totalCount = Number(countResult[0].count);
      } else if (
        countResult &&
        countResult.length > 0 &&
        countResult[0] &&
        countResult[0].count !== null &&
        countResult[0].count !== undefined
      ) {
        totalCount = Number(countResult[0].count);
      }
    } catch (error) {
      console.error('Error parsing count result:', error);
      totalCount = 0;
    }

    const totalPages = Math.ceil(totalCount / limit);

    // Get tickets with pagination
    const userTickets = await db
      .select()
      .from(ticket)
      .where(and(...conditions))
      .orderBy(desc(ticket.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse attachments for each ticket
    const ticketsWithAttachments = userTickets.map((ticket) => ({
      ...ticket,
      attachments: JSON.parse(ticket.attachments || '[]'),
    }));

    return NextResponse.json({
      tickets: ticketsWithAttachments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
