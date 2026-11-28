import { NextRequest } from 'next/server';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';
import { livekitConfig } from '@/app/lib/deep-work/livekit';
import { screenCheckTiming } from '@/app/lib/deep-work/screen-checks';
import {
  screenShareRequired,
  toMessageView,
  toSessionView,
  type DeepWorkSessionPayload,
} from '@/app/lib/deep-work/sessions';
import { prisma } from '@/db';

/**
 * The signed-in student's own id. Deep Work sessions are personal, so `?userId=`
 * (the instructor "view as student" parameter) is refused here.
 */
export async function studentIdForRequest(
  request: NextRequest
): Promise<{ userId: string | null; status: number; error: string | null }> {
  if (new URL(request.url).searchParams.has('userId')) {
    return { userId: null, status: 403, error: 'Only the student can use their Deep Work session.' };
  }
  const { userId, error } = await getUserIdForRequest(request);
  if (!userId) return { userId: null, status: 401, error: error || 'Unauthorized' };
  return { userId, status: 200, error: null };
}

/** The session if it belongs to this student, else null (callers answer 404). */
export async function findOwnSession(sessionId: string, userId: string) {
  const session = await prisma.deepWorkSession.findUnique({ where: { id: sessionId } });
  return session && session.userId === userId ? session : null;
}

/** True when this session's chat should stay locked until the student shares their screen. */
export async function isShareRequired(session: {
  status: 'ACTIVE' | 'WRAPPING_UP' | 'COMPLETED';
  firstCheckOnTrack: boolean | null;
}) {
  return screenShareRequired({
    status: session.status,
    livekitConfigured: livekitConfig() !== null,
    firstCheckDone: session.firstCheckOnTrack !== null,
  });
}

export async function sessionPayload(sessionId: string): Promise<DeepWorkSessionPayload> {
  const session = await prisma.deepWorkSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  return {
    session: toSessionView(session, { shareRequired: await isShareRequired(session) }),
    messages: session.messages.map(toMessageView),
    livekitConfigured: livekitConfig() !== null,
    screenCheck: screenCheckTiming(),
  };
}
