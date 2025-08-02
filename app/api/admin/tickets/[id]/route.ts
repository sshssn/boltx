import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { ticket } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
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

    const { status } = await request.json();

    if (
      !status ||
      !['open', 'in_progress', 'resolved', 'closed'].includes(status)
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set resolvedAt if status is resolved
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    // Update ticket status
    await db.update(ticket).set(updateData).where(eq(ticket.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
