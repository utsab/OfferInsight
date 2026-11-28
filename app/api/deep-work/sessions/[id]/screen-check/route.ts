import { NextRequest, NextResponse } from 'next/server';
import { anthropicConfigured } from '@/app/lib/deep-work/ai-host';
import { findOwnSession, sessionPayload, studentIdForRequest } from '@/app/lib/deep-work/session-store';
import {
  MAX_CONTACT_SHEET_BYTES,
  isScreenCheckDue,
  parseFrameTimes,
  parseImageDataUrl,
  runScreenCheck,
  screenCheckChatMessage,
  screenCheckTiming,
} from '@/app/lib/deep-work/screen-checks';
import { prisma } from '@/db';

/**
 * A due screen check. Body: `{ image: "data:image/jpeg;base64,...", frameTimes: [iso, ...] }`
 * where the image is a contact sheet of up to 6 frames. The image is only passed to Claude
 * and never stored or logged; the result is saved as a DeepWorkScreenCheck plus a chat message.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    const session = await findOwnSession(id, userId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (session.status !== 'ACTIVE' || !session.screenShareOn) {
      return NextResponse.json({ error: 'No screen check is running for this session.' }, { status: 409 });
    }
    const now = new Date();
    if (!isScreenCheckDue(session.nextScreenCheckAt, now)) {
      return NextResponse.json(
        { error: 'The next screen check is not due yet.', nextScreenCheckAt: session.nextScreenCheckAt?.toISOString() ?? null },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);
    const image = parseImageDataUrl(body?.image);
    const frameTimes = parseFrameTimes(body?.frameTimes);
    if (!image || !frameTimes) {
      return NextResponse.json({ error: 'Send a JPEG or PNG contact sheet and 1 to 6 frame times.' }, { status: 400 });
    }
    if (image.bytes > MAX_CONTACT_SHEET_BYTES) {
      return NextResponse.json({ error: 'The contact sheet is too large.' }, { status: 413 });
    }

    const timing = screenCheckTiming();
    // Claim this check (two tabs can't both run it) and schedule the next one.
    const { count } = await prisma.deepWorkSession.updateMany({
      where: { id, nextScreenCheckAt: session.nextScreenCheckAt },
      data: { nextScreenCheckAt: new Date(now.getTime() + timing.checkIntervalMs) },
    });
    if (count !== 1) {
      return NextResponse.json({ error: 'This screen check already ran.' }, { status: 409 });
    }

    // Without a plan there's nothing to compare against; the next check is already scheduled.
    if (!session.plan) return NextResponse.json({ skipped: true, ...(await sessionPayload(id)) });

    if (!anthropicConfigured()) {
      return NextResponse.json({ error: 'The AI host is not set up (ANTHROPIC_API_KEY).' }, { status: 503 });
    }

    let result;
    try {
      result = await runScreenCheck({ plan: session.plan, image, frameTimes });
    } catch (aiError) {
      console.error('Deep Work screen check call failed:', aiError instanceof Error ? aiError.message : aiError);
      return NextResponse.json({ error: 'The screen check failed; it will run again next time.' }, { status: 502 });
    }

    await prisma.$transaction([
      prisma.deepWorkScreenCheck.create({
        data: { sessionId: id, checkedAt: now, onTrack: result.onTrack, note: result.note, frameCount: frameTimes.length },
      }),
      prisma.deepWorkMessage.create({
        data: { sessionId: id, role: 'AI', content: screenCheckChatMessage(result, timing.checkIntervalMs) },
      }),
      prisma.deepWorkSession.update({
        where: { id },
        data: {
          // After every check, keeping the share on is the student's choice.
          pendingShareChoice: true,
          // The first check is the 30-minute mark; record whether they were on track.
          ...(session.firstCheckOnTrack === null ? { firstCheckOnTrack: result.onTrack } : {}),
        },
      }),
    ]);

    return NextResponse.json({ skipped: false, onTrack: result.onTrack, ...(await sessionPayload(id)) });
  } catch (error) {
    console.error('Error running Deep Work screen check:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
