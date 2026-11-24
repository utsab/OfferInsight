import {
  DEEP_WORK_SLOTS,
  deepWorkSchedulePayload,
  getDeepWorkSlot,
  nextDeepWorkSession,
  nextSlotStart,
  slotLabel,
  slotTimeRange,
  sortSlotKeys,
  validateSlotSelection,
} from '../lib/deep-work/slots';

const slot = (key: string) => {
  const found = getDeepWorkSlot(key);
  if (!found) throw new Error(`missing slot ${key}`);
  return found;
};

describe('Deep Work slot list', () => {
  it('has the six agreed Pacific-time slots with unique keys', () => {
    expect(DEEP_WORK_SLOTS.map(slotLabel)).toEqual([
      'Monday 7-9 PM',
      'Tuesday 2-4 PM',
      'Wednesday 2-4 PM',
      'Thursday 6-8 PM',
      'Saturday 12-2 PM',
      'Sunday 12-2 PM',
    ]);
    expect(new Set(DEEP_WORK_SLOTS.map((s) => s.key)).size).toBe(DEEP_WORK_SLOTS.length);
  });

  it('labels ranges that cross noon with both suffixes', () => {
    expect(slotTimeRange({ key: 'x', dayOfWeek: 1, startTime: '11:00' })).toBe('11 AM-1 PM');
    expect(slotTimeRange({ key: 'x', dayOfWeek: 1, startTime: '09:30' })).toBe('9:30-11:30 AM');
  });

  it('sorts keys into weekly order and drops unknown keys', () => {
    expect(sortSlotKeys(['sun-12', 'bogus', 'mon-19'])).toEqual(['mon-19', 'sun-12']);
  });
});

describe('validateSlotSelection', () => {
  it('accepts exactly two distinct known slots', () => {
    expect(validateSlotSelection(['mon-19', 'thu-18'])).toBeNull();
  });

  it.each([
    ['not an array', 'mon-19'],
    ['non-string entries', ['mon-19', 7]],
    ['duplicates', ['mon-19', 'mon-19']],
    ['an unknown slot', ['mon-19', 'fri-09']],
    ['one slot', ['mon-19']],
    ['three slots', ['mon-19', 'tue-14', 'wed-14']],
    ['nothing', []],
  ])('rejects %s', (_label, keys) => {
    expect(validateSlotSelection(keys)).toEqual(expect.any(String));
  });
});

describe('nextSlotStart', () => {
  // Tuesday 2026-11-24, 10:00 AM PST
  const TUE_MORNING = new Date('2026-11-24T18:00:00.000Z');

  it('returns later today when the slot is today and has not started', () => {
    expect(nextSlotStart(slot('tue-14'), TUE_MORNING).toISOString()).toBe('2026-11-24T22:00:00.000Z');
  });

  it('keeps returning the current occurrence while it is running', () => {
    const midSession = new Date('2026-11-24T23:30:00.000Z'); // 3:30 PM PST
    expect(nextSlotStart(slot('tue-14'), midSession).toISOString()).toBe('2026-11-24T22:00:00.000Z');
  });

  it('rolls to next week once the session has ended', () => {
    const justEnded = new Date('2026-11-25T00:00:00.000Z'); // 4:00 PM PST
    expect(nextSlotStart(slot('tue-14'), justEnded).toISOString()).toBe('2026-12-01T22:00:00.000Z');
  });

  it('handles evening slots that fall on the next UTC day', () => {
    // Monday 7 PM PST = Tuesday 03:00 UTC
    expect(nextSlotStart(slot('mon-19'), TUE_MORNING).toISOString()).toBe('2026-12-01T03:00:00.000Z');
  });

  it('uses Pacific daylight time after the spring change', () => {
    const satBeforeDst = new Date('2026-03-07T20:00:00.000Z'); // Sat noon PST
    // Sunday 2026-03-08 is the DST switch: noon PDT = 19:00 UTC
    expect(nextSlotStart(slot('sun-12'), satBeforeDst).toISOString()).toBe('2026-03-08T19:00:00.000Z');
  });
});

describe('nextDeepWorkSession', () => {
  it('picks the soonest of the student slots', () => {
    const now = new Date('2026-11-24T18:00:00.000Z'); // Tue 10 AM PST
    const next = nextDeepWorkSession(['mon-19', 'thu-18'], now);
    expect(next).toMatchObject({
      slotKey: 'thu-18',
      startIso: '2026-11-27T02:00:00.000Z',
      endIso: '2026-11-27T04:00:00.000Z',
      inProgress: false,
    });
    expect(next?.label).toMatch(/Thursday, November 26 at 6:00\s?PM PST/);
  });

  it('flags a session that is running now', () => {
    const now = new Date('2026-11-27T03:00:00.000Z'); // Thu 7 PM PST
    expect(nextDeepWorkSession(['thu-18', 'sat-12'], now)).toMatchObject({
      slotKey: 'thu-18',
      inProgress: true,
    });
  });

  it('returns null with no known slots', () => {
    expect(nextDeepWorkSession([])).toBeNull();
    expect(nextDeepWorkSession(['bogus'])).toBeNull();
  });
});

describe('deepWorkSchedulePayload', () => {
  it('returns sorted keys, the timezone, and the next session', () => {
    const now = new Date('2026-11-24T18:00:00.000Z');
    const payload = deepWorkSchedulePayload(['sun-12', 'tue-14'], now);
    expect(payload.slotKeys).toEqual(['tue-14', 'sun-12']);
    expect(payload.timezone).toBe('America/Los_Angeles');
    expect(payload.nextSession?.slotKey).toBe('tue-14');
  });
});
