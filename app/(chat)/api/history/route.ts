import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const startingAfter = searchParams.get('starting_after');
    const endingBefore = searchParams.get('ending_before');

    if (startingAfter && endingBefore) {
      return new ChatSDKError(
        'bad_request:api',
        'Only one of starting_after or ending_before can be provided.',
      ).toResponse();
    }

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { chats, hasMore } = await getChatsByUserId({
      id: session.user.id,
      limit,
      startingAfter,
      endingBefore,
    });

    return Response.json({ chats, hasMore });
  } catch (error) {
    console.error('History API error:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return new Response(
        JSON.stringify({
          error: 'Database connection error',
          details: 'Database configuration is missing or invalid',
          retryable: false,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check if it's a ChatSDKError
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: 'Failed to fetch chat history',
        retryable: true,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
