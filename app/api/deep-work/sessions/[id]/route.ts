import { NextRequest, NextResponse } from 'next/server';
import { findOwnSession, sessionPayload, studentIdForRequest } from '@/app/lib/deep-work/session-store';

/** The session, its chat so far, and whether screen sharing is set up. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, status, error } = await studentIdForRequest(request);
    if (!userId) return NextResponse.json({ error }, { status });
    const { id } = await context.params;
    if (!(await findOwnSession(id, userId))) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(await sessionPayload(id));
  } catch (error) {
    console.error('Error loading Deep Work session:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
