import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { user, passwordResetToken } from '@/lib/db/schema';
import { generateHashedPassword } from '@/lib/db/utils';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password)
    return NextResponse.json(
      { error: 'Missing token or password' },
      { status: 400 },
    );

  // Find token in DB
  const [resetToken] = await db
    .select()
    .from(passwordResetToken)
    .where(eq(passwordResetToken.token, token));
  if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }

  // Update user password
  const hashed = generateHashedPassword(password);
  await db
    .update(user)
    .set({ password: hashed })
    .where(eq(user.id, resetToken.userId));

  // Delete token
  await db
    .delete(passwordResetToken)
    .where(eq(passwordResetToken.token, token));

  return NextResponse.json({ success: true });
}
