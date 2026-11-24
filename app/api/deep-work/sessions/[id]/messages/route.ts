import { NextRequest, NextResponse } from 'next/server';
import { anthropicConfigured, runHostTurn } from '@/app/lib/deep-work/ai-host';
import { findOwnSession, sessionPayload, studentIdForRequest } from '@/app/lib/deep-work/session-store';
import { sessionPhase, sessionSlotLabel, validateStudentMessage } from '@/app/lib/deep-work/sessions';
import { prisma } from '@/db';

/**
 * Save the student's chat message and the AI host's reply. Body: `{ content: "..." }`.
 * Returns the whole session payload so the page can re-render from one source.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    const session = await findOwnSession(id, userId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const phase = sessionPhase(session);
    if (phase === 'done') {
      return NextResponse.json({ error: 'This session is finished.' }, { status: 409 });
    }
    const body = await request.json().catch(() => null);
    const invalid = validateStudentMessage(body?.content);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    if (!anthropicConfigured()) {
      return NextResponse.json({ error: 'The AI host is not set up (ANTHROPIC_API_KEY).' }, { status: 503 });
    }

    const content = (body.content as string).trim();
    await prisma.deepWorkMessage.create({ data: { sessionId: id, role: 'STUDENT', content } });

    const [history, user] = await Promise.all([
      prisma.deepWorkMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);

    let turn;
    try {
      turn = await runHostTurn({
        phase,
        studentName: user?.name ?? null,
        sessionLabel: sessionSlotLabel(session.slotKey),
        plan: session.plan,
        scheduledEnd: session.scheduledEnd,
        history,
      });
    } catch (aiError) {
      console.error('Deep Work AI host call failed:', aiError);
      return NextResponse.json(
        { error: "The AI host didn't answer. Your message was saved; try again in a moment.", ...(await sessionPayload(id)) },
        { status: 502 }
      );
    }

    const updates =
      phase === 'summary'
        ? turn.summary
          ? { summary: turn.summary, status: 'COMPLETED' as const, endedAt: new Date() }
          : null
        : turn.plan
          ? { plan: turn.plan }
          : null;

    await prisma.$transaction([
      prisma.deepWorkMessage.create({ data: { sessionId: id, role: 'AI', content: turn.reply } }),
      ...(updates ? [prisma.deepWorkSession.update({ where: { id }, data: updates })] : []),
    ]);

    return NextResponse.json(await sessionPayload(id));
  } catch (error) {
    console.error('Error handling Deep Work message:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
