import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { studentIdForRequest } from '@/app/lib/deep-work/session-store';
import {
  DEEP_WORK_SESSION_MINUTES,
  joinableDeepWorkSession,
  practiceModeEnabled,
} from '@/app/lib/deep-work/slots';
import { openingMessage, PRACTICE_SLOT_KEY, roomNameForSession } from '@/app/lib/deep-work/sessions';
import { prisma } from '@/db';

type Occurrence = { slotKey: string; scheduledStart: Date; scheduledEnd: Date };

/** Create the session row (with the host's opening message), or return the existing one. */
async function findOrCreateSession(userId: string, userName: string | null, occ: Occurrence) {
  const where = { userId_scheduledStart: { userId, scheduledStart: occ.scheduledStart } };
  const existing = await prisma.deepWorkSession.findUnique({ where });
  if (existing) return existing;
  const id = randomUUID();
  try {
    return await prisma.deepWorkSession.create({
      data: {
        id,
        userId,
        slotKey: occ.slotKey,
        scheduledStart: occ.scheduledStart,
        scheduledEnd: occ.scheduledEnd,
        livekitRoom: roomNameForSession(id),
        messages: { create: { role: 'AI', content: openingMessage(userName, occ.scheduledEnd) } },
      },
    });
  } catch (error) {
    // A second tab joined at the same moment: use the row it created.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return prisma.deepWorkSession.findUniqueOrThrow({ where });
    }
    throw error;
  }
}

/**
 * Join the student's current Deep Work session (from 10 minutes before a slot starts
 * until it ends). Body `{ practice: true }` starts a practice session instead, only
 * when DEEP_WORK_PRACTICE_MODE=true outside production. Returns `{ sessionId }`.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });

    const body = await request.json().catch(() => ({}));
    const now = new Date();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    if (body?.practice === true) {
      if (!practiceModeEnabled()) {
        return NextResponse.json({ error: 'Practice sessions are turned off.' }, { status: 403 });
      }
      const open = await prisma.deepWorkSession.findFirst({
        where: { userId, slotKey: PRACTICE_SLOT_KEY, status: { not: 'COMPLETED' }, scheduledEnd: { gt: now } },
        orderBy: { scheduledStart: 'desc' },
      });
      const scheduledStart = new Date(Math.floor(now.getTime() / 1000) * 1000);
      const session =
        open ??
        (await findOrCreateSession(userId, user?.name ?? null, {
          slotKey: PRACTICE_SLOT_KEY,
          scheduledStart,
          scheduledEnd: new Date(scheduledStart.getTime() + DEEP_WORK_SESSION_MINUTES * 60_000),
        }));
      return NextResponse.json({ sessionId: session.id });
    }

    const slots = await prisma.deepWorkSlotSignup.findMany({ where: { userId }, select: { slotKey: true } });
    const joinable = joinableDeepWorkSession(slots.map((s) => s.slotKey), now);
    if (!joinable) {
      return NextResponse.json(
        { error: 'None of your Deep Work sessions is open right now. Joining opens 10 minutes before the start.' },
        { status: 409 }
      );
    }
    const session = await findOrCreateSession(userId, user?.name ?? null, {
      slotKey: joinable.slotKey,
      scheduledStart: new Date(joinable.startIso),
      scheduledEnd: new Date(joinable.endIso),
    });
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error joining Deep Work session:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
