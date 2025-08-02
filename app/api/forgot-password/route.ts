import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, passwordResetToken } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If this email exists, a reset link will be sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in passwordResetToken table
    await db
      .insert(passwordResetToken)
      .values({
        userId: userRecord[0].id,
        token: resetToken,
        expiresAt: resetTokenExpiry,
      });

    // In a real app, you would send an email here
    // For now, we'll just return success
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json(
      { message: 'If this email exists, a reset link will be sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
