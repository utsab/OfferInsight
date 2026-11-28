import { NextRequest, NextResponse } from 'next/server';
import { findOwnSession, sessionPayload, studentIdForRequest } from '@/app/lib/deep-work/session-store';
import { wrapUpMessage } from '@/app/lib/deep-work/sessions';
import { prisma } from '@/db';

/**
 * Start wrapping up: the student clicked End, or the page's timer ran out. The host asks
 * for a progress summary; the session completes once the summary is saved. Idempotent.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    const session = await findOwnSession(id, userId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (session.status === 'ACTIVE') {
      // Only the first End wins, so two tabs can't post the wrap-up question twice.
      const { count } = await prisma.deepWorkSession.updateMany({
        where: { id, status: 'ACTIVE' },
        data: { status: 'WRAPPING_UP', wrapUpAt: new Date(), pendingShareChoice: false },
      });
      if (count === 1) {
        await prisma.deepWorkMessage.create({
          data: { sessionId: id, role: 'AI', content: wrapUpMessage(session.plan) },
        });
      }
    }
    return NextResponse.json(await sessionPayload(id));
  } catch (error) {
    console.error('Error ending Deep Work session:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
