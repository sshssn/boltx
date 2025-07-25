import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/utils';
import { user } from '@/lib/db/schema';
import { hashPassword } from '@/lib/utils';

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
    .from('password_reset_tokens')
    .where({ token });
  if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }

  // Update user password
  const hashed = await hashPassword(password);
  await db
    .update(user)
    .set({ password: hashed })
    .where(user.id.eq(resetToken.user_id));

  // Delete token
  await db.delete('password_reset_tokens').where({ token });

  return NextResponse.json({ success: true });
}
