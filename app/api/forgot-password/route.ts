import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { user, passwordResetToken } from '@/lib/db/schema';
import { randomBytes } from 'node:crypto';
import { createTransport } from 'nodemailer';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Find user by email
  const [foundUser] = await db.select().from(user).where(eq(user.email, email));
  if (!foundUser) {
    // Always respond success to avoid leaking info
    return NextResponse.json({ success: true });
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  // Store token in DB
  await db.insert(passwordResetToken).values({
    userId: foundUser.id,
    token,
    expiresAt,
  });

  // Send email
  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
  });

  return NextResponse.json({ success: true });
}
