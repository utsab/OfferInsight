import {
  firstName,
  openingMessage,
  screenShareRequired,
  sessionPhase,
  shareReminderDelayMs,
  sessionSlotLabel,
  toSessionView,
  validateStudentMessage,
  wrapUpMessage,
} from '../lib/deep-work/sessions';
import { canJoinNow, joinableDeepWorkSession, nextDeepWorkSession, practiceModeEnabled } from '../lib/deep-work/slots';

describe('sessionPhase', () => {
  it.each([
    [{ status: 'ACTIVE', plan: null }, 'planning'],
    [{ status: 'ACTIVE', plan: 'Send 5 applications' }, 'working'],
    [{ status: 'WRAPPING_UP', plan: null }, 'summary'],
    [{ status: 'COMPLETED', plan: 'x' }, 'done'],
  ] as const)('%o is %s', (session, phase) => {
    expect(sessionPhase(session)).toBe(phase);
  });
});

describe('join window', () => {
  // Thursday 2026-11-26 6 PM PST = 2026-11-27T02:00Z
  const keys = ['thu-18'];

  it('opens 10 minutes before the start', () => {
    expect(joinableDeepWorkSession(keys, new Date('2026-11-27T01:49:00Z'))).toBeNull();
    expect(joinableDeepWorkSession(keys, new Date('2026-11-27T01:50:00Z'))?.startIso).toBe('2026-11-27T02:00:00.000Z');
  });

  it('stays open until the scheduled end', () => {
    expect(joinableDeepWorkSession(keys, new Date('2026-11-27T03:59:00Z'))).not.toBeNull();
    expect(joinableDeepWorkSession(keys, new Date('2026-11-27T04:00:00Z'))).toBeNull();
  });

  it('reports joinOpensIso so the card can switch its button', () => {
    const next = nextDeepWorkSession(keys, new Date('2026-11-24T18:00:00Z'))!;
    expect(next.joinOpensIso).toBe('2026-11-27T01:50:00.000Z');
    expect(canJoinNow(next, new Date('2026-11-24T18:00:00Z'))).toBe(false);
  });
});

describe('practiceModeEnabled', () => {
  it('needs the flag and a non-production environment', () => {
    expect(practiceModeEnabled({ NODE_ENV: 'development', DEEP_WORK_PRACTICE_MODE: 'true' } as NodeJS.ProcessEnv)).toBe(true);
    expect(practiceModeEnabled({ NODE_ENV: 'production', DEEP_WORK_PRACTICE_MODE: 'true' } as NodeJS.ProcessEnv)).toBe(false);
    expect(practiceModeEnabled({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe('host messages', () => {
  it('greets by first name and gives the end time in Pacific time', () => {
    const text = openingMessage('Sam Lee', new Date('2026-11-27T04:00:00Z'));
    expect(text).toMatch(/^Hi Sam!/);
    expect(text).toMatch(/until 8:00\sPM PT/);
  });

  it('greets without a name', () => {
    expect(openingMessage(null, new Date())).toMatch(/^Hi! /);
    expect(firstName('   ')).toBeNull();
  });

  it('quotes the plan when wrapping up', () => {
    expect(wrapUpMessage('Finish my resume')).toContain('"Finish my resume"');
    expect(wrapUpMessage(null)).not.toContain('plan was');
  });
});

describe('validateStudentMessage', () => {
  it('accepts normal text and rejects empty or huge messages', () => {
    expect(validateStudentMessage('I will send 3 applications')).toBeNull();
    expect(validateStudentMessage('   ')).toEqual(expect.any(String));
    expect(validateStudentMessage(42)).toEqual(expect.any(String));
    expect(validateStudentMessage('x'.repeat(4001))).toEqual(expect.any(String));
  });
});

describe('toSessionView', () => {
  it('labels slots and practice sessions', () => {
    expect(sessionSlotLabel('mon-19')).toBe('Monday 7-9 PM');
    expect(sessionSlotLabel('practice')).toBe('Practice session');
    const view = toSessionView({
      id: 's1',
      slotKey: 'mon-19',
      scheduledStart: new Date('2026-12-01T03:00:00Z'),
      scheduledEnd: new Date('2026-12-01T05:00:00Z'),
      status: 'ACTIVE',
      plan: null,
      summary: null,
      wrapUpAt: null,
      endedAt: null,
    });
    expect(view).toMatchObject({ phase: 'planning', label: 'Monday 7-9 PM', scheduledEnd: '2026-12-01T05:00:00.000Z' });
  });
});

describe('required screen sharing', () => {
  it('is required while active until an on-track check, and only with LiveKit set up', () => {
    expect(screenShareRequired({ status: 'ACTIVE', livekitConfigured: true, hasOnTrackCheck: false })).toBe(true);
    expect(screenShareRequired({ status: 'ACTIVE', livekitConfigured: true, hasOnTrackCheck: true })).toBe(false);
    expect(screenShareRequired({ status: 'WRAPPING_UP', livekitConfigured: true, hasOnTrackCheck: false })).toBe(false);
    expect(screenShareRequired({ status: 'ACTIVE', livekitConfigured: false, hasOnTrackCheck: false })).toBe(false);
  });

  it('asks the student to share in the opening message when required', () => {
    expect(openingMessage('Sam', new Date(), true)).toContain('click Share screen');
    expect(openingMessage('Sam', new Date(), false)).not.toContain('Share screen');
  });
});

describe('shareReminderDelayMs', () => {
  const base = {
    status: 'ACTIVE' as const,
    shareRequired: true,
    nextScreenCheckAt: null,
    startedAt: '2026-11-27T03:00:00.000Z',
  };
  const at = (iso: string) => Date.parse(iso);

  it('counts down to 5 minutes after joining', () => {
    expect(shareReminderDelayMs(base, false, at('2026-11-27T03:02:00Z'))).toBe(180_000);
    expect(shareReminderDelayMs(base, false, at('2026-11-27T03:09:00Z'))).toBe(0);
  });

  it('does not apply once they share, have shared before, or sharing is not required', () => {
    expect(shareReminderDelayMs(base, true, at('2026-11-27T03:02:00Z'))).toBeNull();
    expect(shareReminderDelayMs({ ...base, nextScreenCheckAt: '2026-11-27T03:40:00.000Z' }, false)).toBeNull();
    expect(shareReminderDelayMs({ ...base, shareRequired: false }, false)).toBeNull();
    expect(shareReminderDelayMs({ ...base, status: 'WRAPPING_UP' }, false)).toBeNull();
  });
});
