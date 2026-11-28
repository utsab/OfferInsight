import { NextRequest, NextResponse } from 'next/server';
import { createRoomToken, livekitConfig } from '@/app/lib/deep-work/livekit';
import { findOwnSession, studentIdForRequest } from '@/app/lib/deep-work/session-store';
import { prisma } from '@/db';

/** A LiveKit token for this session's room, so the browser can publish its screen share. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    const session = await findOwnSession(id, userId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status === 'COMPLETED' || session.scheduledEnd.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This session has ended.' }, { status: 409 });
    }
    const config = livekitConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Screen sharing is not set up (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).' },
        { status: 503 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const token = await createRoomToken(config, {
      room: session.livekitRoom,
      identity: userId,
      name: user?.name ?? null,
      scheduledEnd: session.scheduledEnd,
    });
    return NextResponse.json({ token, url: config.url });
  } catch (error) {
    console.error('Error creating Deep Work room token:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
