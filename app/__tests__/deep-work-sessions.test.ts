import {
  firstName,
  openingMessage,
  sessionPhase,
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
