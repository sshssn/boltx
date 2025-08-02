import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// Simple in-memory maintenance mode (in production, this should be stored in a database)
let maintenanceMode = false;
let maintenanceMessage = '';
let maintenanceDuration = '';

// Temporary function to disable maintenance mode
export function disableMaintenanceMode() {
  maintenanceMode = false;
  maintenanceMessage = '';
  maintenanceDuration = '';
}

export async function GET() {
  try {
    return NextResponse.json({
      maintenanceMode,
      maintenanceMessage,
      maintenanceDuration,
    });
  } catch (error) {
    console.error('Error getting maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to get maintenance mode status' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      maintenanceMode: newMaintenanceMode,
      message,
      duration,
    } = await request.json();

    // Update maintenance mode settings
    maintenanceMode = newMaintenanceMode;
    maintenanceMessage = message || '';
    maintenanceDuration = duration || '';

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance mode' },
      { status: 500 },
    );
  }
}
