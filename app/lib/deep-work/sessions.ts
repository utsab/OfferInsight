/**
 * Deep Work session rooms: the shapes the API returns, and the rules for which phase a
 * session is in. Kept free of Prisma and network calls so it can be unit tested.
 */
import { DEEP_WORK_TIMEZONE, getDeepWorkSlot, slotLabel } from '@/app/lib/deep-work/slots';

export const PRACTICE_SLOT_KEY = 'practice';
export const MAX_STUDENT_MESSAGE_CHARS = 4000;

export type DeepWorkSessionStatus = 'ACTIVE' | 'WRAPPING_UP' | 'COMPLETED';
export type DeepWorkMessageRole = 'AI' | 'STUDENT';

/**
 * What the AI host is doing right now.
 * - planning: waiting for the student's plan for this session
 * - working: plan captured, student is heads-down; the host answers briefly
 * - summary: student ended (or time ran out); waiting for a progress summary
 * - done: summary captured, session closed
 */
export type DeepWorkPhase = 'planning' | 'working' | 'summary' | 'done';

export function sessionPhase(session: {
  status: DeepWorkSessionStatus;
  plan: string | null;
}): DeepWorkPhase {
  if (session.status === 'COMPLETED') return 'done';
  if (session.status === 'WRAPPING_UP') return 'summary';
  return session.plan ? 'working' : 'planning';
}

export function roomNameForSession(sessionId: string): string {
  return `dw-${sessionId}`;
}

/** "Monday 7-9 PM", or "Practice session" for a dev-only session. */
export function sessionSlotLabel(slotKey: string): string {
  if (slotKey === PRACTICE_SLOT_KEY) return 'Practice session';
  const slot = getDeepWorkSlot(slotKey);
  return slot ? slotLabel(slot) : 'Deep Work session';
}

/** "7:00 PM" in Pacific time. */
export function pacificClockTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEEP_WORK_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function firstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

/** The host's first message, written when the session row is created. */
export function openingMessage(name: string | null | undefined, scheduledEnd: Date): string {
  const hello = firstName(name) ? `Hi ${firstName(name)}!` : 'Hi!';
  return (
    `${hello} Welcome to Deep Work. You have until ${pacificClockTime(scheduledEnd)} PT. ` +
    'What do you plan to get done in this session? The more specific, the better, ' +
    'for example "send 5 applications" or "finish the README section of my open source PR".'
  );
}

/** The host's message when the student clicks End or time runs out. */
export function wrapUpMessage(plan: string | null): string {
  const planPart = plan ? ` Your plan was: "${plan}".` : '';
  return (
    `Time to wrap up.${planPart} How did it go? Tell me what you got done, ` +
    'what is left, and anything that got in the way.'
  );
}

export function validateStudentMessage(content: unknown): string | null {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return 'Type a message first.';
  }
  if (content.length > MAX_STUDENT_MESSAGE_CHARS) {
    return `Messages can be up to ${MAX_STUDENT_MESSAGE_CHARS} characters.`;
  }
  return null;
}

export type DeepWorkMessageView = {
  id: string;
  role: DeepWorkMessageRole;
  content: string;
  createdAt: string;
};

export type DeepWorkSessionView = {
  id: string;
  slotKey: string;
  label: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: DeepWorkSessionStatus;
  phase: DeepWorkPhase;
  plan: string | null;
  summary: string | null;
  wrapUpAt: string | null;
  endedAt: string | null;
};

/** What GET /api/deep-work/sessions/[id] and the session actions return. */
export type DeepWorkSessionPayload = {
  session: DeepWorkSessionView;
  messages: DeepWorkMessageView[];
  /** False when LIVEKIT_* env vars are missing: chat works, screen share is off */
  livekitConfigured: boolean;
};

type SessionRow = {
  id: string;
  slotKey: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: DeepWorkSessionStatus;
  plan: string | null;
  summary: string | null;
  wrapUpAt: Date | null;
  endedAt: Date | null;
};

type MessageRow = { id: string; role: DeepWorkMessageRole; content: string; createdAt: Date };

export function toSessionView(row: SessionRow): DeepWorkSessionView {
  return {
    id: row.id,
    slotKey: row.slotKey,
    label: sessionSlotLabel(row.slotKey),
    scheduledStart: row.scheduledStart.toISOString(),
    scheduledEnd: row.scheduledEnd.toISOString(),
    status: row.status,
    phase: sessionPhase(row),
    plan: row.plan,
    summary: row.summary,
    wrapUpAt: row.wrapUpAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
  };
}

export function toMessageView(row: MessageRow): DeepWorkMessageView {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}
