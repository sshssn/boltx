import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/utils';
import { user } from '@/lib/db/schema';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email)
    return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Find user by email
  const [foundUser] = await db.select().from(user).where(user.email.eq(email));
  if (!foundUser) {
    // Always respond success to avoid leaking info
    return NextResponse.json({ success: true });
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  // Store token in DB
  await db.insert('password_reset_tokens').values({
    user_id: foundUser.id,
    token,
    expires_at: expiresAt,
  });

  // Send email
  const transporter = nodemailer.createTransport({
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
