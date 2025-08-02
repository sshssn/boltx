import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to verify MFA
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    const { token, backupCode } = await request.json();

    if (!token && !backupCode) {
      return NextResponse.json(
        { error: 'Token or backup code required' },
        { status: 400 },
      );
    }

    // Get the user's MFA information
    const [userRecord] = await db
      .select({
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret,
        mfaBackupCodes: user.mfaBackupCodes,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userRecord?.mfaEnabled) {
      return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    }

    let verified = false;

    if (backupCode) {
      // Verify backup code
      const backupCodes = (userRecord.mfaBackupCodes as string[]) || [];
      const codeIndex = backupCodes.indexOf(backupCode);

      if (codeIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 400 },
        );
      }

      // Remove the used backup code
      backupCodes.splice(codeIndex, 1);
      await db
        .update(user)
        .set({ mfaBackupCodes: backupCodes })
        .where(eq(user.id, session.user.id));

      verified = true;
    } else if (token && userRecord.mfaSecret) {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: userRecord.mfaSecret,
        encoding: 'base32',
        token: token,
        window: 2, // Allow 2 time steps (60 seconds) for clock skew
      });
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    return NextResponse.json({
      message: 'MFA verification successful',
    });
  } catch (error) {
    console.error('Error verifying MFA:', error);
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

    // Only allow admin users to check MFA status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    // Get the user's MFA status
    const [userRecord] = await db
      .select({
        mfaEnabled: user.mfaEnabled,
        mfaBackupCodes: user.mfaBackupCodes,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    return NextResponse.json({
      mfaEnabled: userRecord?.mfaEnabled || false,
      backupCodesRemaining: ((userRecord?.mfaBackupCodes as string[]) || [])
        .length,
    });
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
