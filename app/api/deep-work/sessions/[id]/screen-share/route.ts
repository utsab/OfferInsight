import { NextRequest, NextResponse } from 'next/server';
import { findOwnSession, sessionPayload, studentIdForRequest } from '@/app/lib/deep-work/session-store';
import { screenCheckTiming } from '@/app/lib/deep-work/screen-checks';
import { prisma } from '@/db';

type Action = 'started' | 'stopped' | 'keep' | 'turn_off';
const ACTIONS: readonly Action[] = ['started', 'stopped', 'keep', 'turn_off'];

/**
 * Screen-share state from the room page. Body `{ action }`:
 * - `started` / `stopped`: the browser began or stopped publishing its screen
 * - `keep` / `turn_off`: the student's answer to "keep tracking or turn sharing off?"
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    const session = await findOwnSession(id, userId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const action = body?.action as Action;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
    if ((action === 'started' || action === 'keep') && session.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Screen checks only run during the session.' }, { status: 409 });
    }

    const timing = screenCheckTiming();
    const now = new Date();

    if (action === 'started') {
      // Keep a check that's already scheduled, so a refresh can't skip it. If it's overdue
      // (sharing was off for a while), give the browser one frame interval to collect frames.
      const next = session.nextScreenCheckAt;
      const nextScreenCheckAt =
        next === null
          ? new Date(now.getTime() + timing.checkIntervalMs)
          : next.getTime() < now.getTime()
            ? new Date(now.getTime() + timing.frameIntervalMs)
            : next;
      await prisma.deepWorkSession.update({ where: { id }, data: { screenShareOn: true, nextScreenCheckAt } });
    } else if (action === 'stopped') {
      await prisma.deepWorkSession.update({ where: { id }, data: { screenShareOn: false } });
    } else if (session.pendingShareChoice) {
      const minutes = Math.round(timing.checkIntervalMs / 60_000);
      const keep = action === 'keep';
      await prisma.$transaction([
        prisma.deepWorkSession.update({
          where: { id },
          data: keep ? { pendingShareChoice: false } : { pendingShareChoice: false, screenShareOn: false },
        }),
        prisma.deepWorkMessage.create({
          data: { sessionId: id, role: 'STUDENT', content: keep ? 'Keep sharing my screen.' : 'Turn screen sharing off.' },
        }),
        prisma.deepWorkMessage.create({
          data: {
            sessionId: id,
            role: 'AI',
            content: keep
              ? `Got it. Screen sharing stays on, and I'll check again in ${minutes} minutes.`
              : 'Done, screen sharing is off. Keep going with your plan, and share again anytime.',
          },
        }),
      ]);
    }
    return NextResponse.json(await sessionPayload(id));
  } catch (error) {
    console.error('Error updating Deep Work screen share:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
