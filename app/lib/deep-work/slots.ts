/**
 * Deep Work sessions: 2-hour AI-hosted focus sessions. Students pick 2 of these
 * fixed weekly slots (Pacific time); picks repeat every week until changed.
 * Editing this list is all it takes to add, move or drop a slot.
 */
import { DAY_LABELS } from '@/app/lib/calendar/constants';
import { getZonedParts, zonedWallTimeToUtc } from '@/app/lib/calendar/slots';

export const DEEP_WORK_TIMEZONE = 'America/Los_Angeles';
export const DEEP_WORK_SESSION_MINUTES = 120;
export const DEEP_WORK_SLOTS_PER_WEEK = 2;
/** Students may join this many minutes before a session starts. */
export const DEEP_WORK_JOIN_EARLY_MINUTES = 10;

export type DeepWorkSlot = {
  /** Stable id stored in the database, e.g. "mon-19" */
  key: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  /** Local start time HH:mm (24h) in DEEP_WORK_TIMEZONE */
  startTime: string;
};

export const DEEP_WORK_SLOTS: readonly DeepWorkSlot[] = [
  { key: 'mon-19', dayOfWeek: 1, startTime: '19:00' },
  { key: 'tue-14', dayOfWeek: 2, startTime: '14:00' },
  { key: 'wed-14', dayOfWeek: 3, startTime: '14:00' },
  { key: 'thu-18', dayOfWeek: 4, startTime: '18:00' },
  { key: 'sat-12', dayOfWeek: 6, startTime: '12:00' },
  { key: 'sun-12', dayOfWeek: 0, startTime: '12:00' },
];

const MINUTE_MS = 60 * 1000;
const SESSION_MS = DEEP_WORK_SESSION_MINUTES * MINUTE_MS;

export function getDeepWorkSlot(key: string): DeepWorkSlot | undefined {
  return DEEP_WORK_SLOTS.find((slot) => slot.key === key);
}

/** Keys in the fixed slot order (Mon, Tue, … Sun), unknown keys dropped. */
export function sortSlotKeys(keys: readonly string[]): string[] {
  return DEEP_WORK_SLOTS.filter((slot) => keys.includes(slot.key)).map((slot) => slot.key);
}

/** Error message for an invalid pick, or null when it's exactly 2 distinct known slots. */
export function validateSlotSelection(keys: unknown): string | null {
  if (!Array.isArray(keys) || !keys.every((k) => typeof k === 'string')) {
    return 'slotKeys must be a list of slot ids.';
  }
  if (new Set(keys).size !== keys.length) {
    return 'Pick two different sessions.';
  }
  if (keys.some((k) => !getDeepWorkSlot(k))) {
    return 'That session time is not available.';
  }
  if (keys.length !== DEEP_WORK_SLOTS_PER_WEEK) {
    return `Pick exactly ${DEEP_WORK_SLOTS_PER_WEEK} sessions per week.`;
  }
  return null;
}

/** "19:00" → "7", "12:30" → "12:30" */
function hourLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? String(hour12) : `${hour12}:${String(m).padStart(2, '0')}`;
}

function endTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = (h * 60 + m + DEEP_WORK_SESSION_MINUTES) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "7-9 PM", "11 AM-1 PM" */
export function slotTimeRange(slot: DeepWorkSlot): string {
  const end = endTime(slot.startTime);
  const startPm = Number(slot.startTime.split(':')[0]) >= 12;
  const endPm = Number(end.split(':')[0]) >= 12;
  const suffix = (pm: boolean) => (pm ? 'PM' : 'AM');
  return startPm === endPm
    ? `${hourLabel(slot.startTime)}-${hourLabel(end)} ${suffix(endPm)}`
    : `${hourLabel(slot.startTime)} ${suffix(startPm)}-${hourLabel(end)} ${suffix(endPm)}`;
}

/** "Monday 7-9 PM" */
export function slotLabel(slot: DeepWorkSlot): string {
  return `${DAY_LABELS[slot.dayOfWeek]} ${slotTimeRange(slot)}`;
}

/** Start of the slot's current-or-next occurrence: the first one that hasn't ended yet. */
export function nextSlotStart(slot: DeepWorkSlot, now = new Date()): Date {
  const today = getZonedParts(now, DEEP_WORK_TIMEZONE);
  const [hours, minutes] = slot.startTime.split(':').map(Number);
  for (let offset = 0; offset <= 7; offset++) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    if (date.getUTCDay() !== slot.dayOfWeek) continue;
    const start = zonedWallTimeToUtc(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      hours,
      minutes,
      DEEP_WORK_TIMEZONE
    );
    if (start.getTime() + SESSION_MS > now.getTime()) return start;
  }
  // Unreachable: some day in the next 8 has the slot's weekday and hasn't ended.
  throw new Error(`No upcoming occurrence for slot ${slot.key}`);
}

export type NextDeepWorkSession = {
  slotKey: string;
  startIso: string;
  endIso: string;
  /** True while the session is running now */
  inProgress: boolean;
  /** e.g. "Monday, November 30 at 7:00 PM PST" */
  label: string;
};

/** The earliest current-or-upcoming session among the student's slots. */
export function nextDeepWorkSession(
  slotKeys: readonly string[],
  now = new Date()
): NextDeepWorkSession | null {
  let best: { slot: DeepWorkSlot; start: Date } | null = null;
  for (const key of slotKeys) {
    const slot = getDeepWorkSlot(key);
    if (!slot) continue;
    const start = nextSlotStart(slot, now);
    if (!best || start < best.start) best = { slot, start };
  }
  if (!best) return null;
  const end = new Date(best.start.getTime() + SESSION_MS);
  return {
    slotKey: best.slot.key,
    startIso: best.start.toISOString(),
    endIso: end.toISOString(),
    inProgress: best.start.getTime() <= now.getTime(),
    label: new Intl.DateTimeFormat('en-US', {
      timeZone: DEEP_WORK_TIMEZONE,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(best.start),
  };
}

/** What GET/PUT /api/deep-work/schedule return. */
export type DeepWorkSchedule = {
  slotKeys: string[];
  timezone: string;
  nextSession: NextDeepWorkSession | null;
};

export function deepWorkSchedulePayload(
  slotKeys: readonly string[],
  now = new Date()
): DeepWorkSchedule {
  const sorted = sortSlotKeys(slotKeys);
  return {
    slotKeys: sorted,
    timezone: DEEP_WORK_TIMEZONE,
    nextSession: nextDeepWorkSession(sorted, now),
  };
}
