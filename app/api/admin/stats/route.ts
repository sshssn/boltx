import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, ticket } from '@/lib/db/schema';
import { eq, ne, not, like, gte, inArray, count, and } from 'drizzle-orm';

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

    // Get total users (excluding guests)
    const totalUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(and(ne(user.role, 'guest'), not(like(user.email, 'guest-%'))));
    const totalUsers = Number(totalUsersResult[0]?.count) || 0;

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonthResult = await db
      .select({ count: count() })
      .from(user)
      .where(
        and(
          gte(user.lastUsernameChange, startOfMonth),
          ne(user.role, 'guest'),
          not(like(user.email, 'guest-%'))
        )
      );
    const newUsersThisMonth = Number(newUsersThisMonthResult[0]?.count) || 0;

    // Get pro users (using role field)
    const proUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(inArray(user.role, ['admin', 'pro']));
    const proUsers = Number(proUsersResult[0]?.count) || 0;
    const proPercentage =
      totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0;

    // Get active tickets
    const activeTicketsResult = await db
      .select({ count: count() })
      .from(ticket)
      .where(inArray(ticket.status, ['open', 'in_progress']));
    const activeTickets = Number(activeTicketsResult[0]?.count) || 0;

    // Get open tickets
    const openTicketsResult = await db
      .select({ count: count() })
      .from(ticket)
      .where(eq(ticket.status, 'open'));
    const openTickets = Number(openTicketsResult[0]?.count) || 0;

    // For now, use placeholder values for messages since we don't have that table
    const messagesToday = 0;
    const messagesGrowth = 0;

    // Get recent activity (simplified for now)
    const recentActivity = [
      {
        type: 'user',
        title: 'New user registered',
        description: 'A new user joined the platform',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'ticket',
        title: 'New support ticket',
        description: 'A user submitted a support request',
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      proUsers,
      proPercentage,
      activeTickets,
      openTickets,
      messagesToday,
      messagesGrowth,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
