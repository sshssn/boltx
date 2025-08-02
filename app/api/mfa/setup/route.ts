import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to setup MFA
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `boltX Admin (${session.user.email})`,
      issuer: 'boltX',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase(),
    );

    // Store the secret and backup codes in the database
    await db
      .update(user)
      .set({
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes,
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
      message:
        'MFA setup initiated. Scan the QR code with your authenticator app.',
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to enable MFA
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Get the user's MFA secret
    const [userRecord] = await db
      .select({ mfaSecret: user.mfaSecret })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userRecord?.mfaSecret) {
      return NextResponse.json({ error: 'MFA not set up' }, { status: 400 });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: userRecord.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) for clock skew
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Enable MFA
    await db
      .update(user)
      .set({ mfaEnabled: true })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('Error enabling MFA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
