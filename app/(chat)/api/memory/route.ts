import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getMemoryByUserId, deleteMemoryById } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.type !== 'regular') {
    return new Response('Unauthorized', { status: 401 });
  }
  const memory = await getMemoryByUserId({
    userId: session.user.id,
    limit: 20,
  });
  return Response.json({ memory });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.type !== 'regular') {
    return new Response('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }
  await deleteMemoryById({ id, userId: session.user.id });
  return new Response('OK');
}
