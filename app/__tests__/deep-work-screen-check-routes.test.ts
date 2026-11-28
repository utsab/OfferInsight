jest.mock('@/db', () => ({
  prisma: {
    deepWorkSession: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    deepWorkMessage: { create: jest.fn() },
    deepWorkScreenCheck: { create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));
jest.mock('@/app/lib/api-user-helper', () => ({ getUserIdForRequest: jest.fn() }));
jest.mock('@/app/lib/deep-work/ai-host', () => ({ anthropicConfigured: jest.fn(() => true), DEEP_WORK_AI_MODEL: 'm', anthropicClient: jest.fn() }));
jest.mock('@/app/lib/deep-work/screen-checks', () => ({
  ...jest.requireActual('@/app/lib/deep-work/screen-checks'),
  runScreenCheck: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST as screenCheck } from '@/app/api/deep-work/sessions/[id]/screen-check/route';
import { POST as screenShare } from '@/app/api/deep-work/sessions/[id]/screen-share/route';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';
import { runScreenCheck } from '@/app/lib/deep-work/screen-checks';
import { prisma } from '@/db';

const db = prisma as unknown as {
  deepWorkSession: Record<'findUnique' | 'findUniqueOrThrow' | 'update' | 'updateMany', jest.Mock>;
  deepWorkMessage: { create: jest.Mock };
  deepWorkScreenCheck: { create: jest.Mock };
};
const mockCheck = runScreenCheck as jest.Mock;
const NOW = new Date('2026-11-27T03:30:00Z');
const params = { params: Promise.resolve({ id: 's1' }) };
const post = (path: string, body: unknown) =>
  new NextRequest(`http://localhost/api/deep-work/sessions/s1/${path}`, { method: 'POST', body: JSON.stringify(body) });
const goodBody = { image: 'data:image/jpeg;base64,QUJD', frameTimes: ['2026-11-27T03:05:00Z', '2026-11-27T03:25:00Z'] };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    userId: 'user-1',
    slotKey: 'thu-18',
    scheduledStart: new Date('2026-11-27T02:00:00Z'),
    scheduledEnd: new Date('2026-11-27T04:00:00Z'),
    status: 'ACTIVE',
    plan: 'Send 5 applications',
    summary: null,
    wrapUpAt: null,
    endedAt: null,
    livekitRoom: 'dw-s1',
    screenShareOn: true,
    nextScreenCheckAt: new Date('2026-11-27T03:30:00Z'),
    pendingShareChoice: false,
    messages: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
  (getUserIdForRequest as jest.Mock).mockResolvedValue({ userId: 'user-1', error: null });
  db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(row());
  db.deepWorkSession.updateMany.mockResolvedValue({ count: 1 });
});
afterEach(() => jest.useRealTimers());

describe('POST /screen-check', () => {
  it('stores the verdict, posts the on-track question, and schedules the next check', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row());
    mockCheck.mockResolvedValue({ onTrack: true, note: 'Applying on Greenhouse', message: 'Nice, 3 applications in.' });
    const res = await screenCheck(post('screen-check', goodBody), params);
    expect(res.status).toBe(200);
    expect(db.deepWorkSession.updateMany.mock.calls[0][0].data.nextScreenCheckAt.toISOString()).toBe('2026-11-27T04:00:00.000Z');
    expect(db.deepWorkScreenCheck.create.mock.calls[0][0].data).toMatchObject({ onTrack: true, note: 'Applying on Greenhouse', frameCount: 2 });
    expect(db.deepWorkMessage.create.mock.calls[0][0].data.content).toMatch(/turn screen sharing off\?$/);
    expect(db.deepWorkSession.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { pendingShareChoice: true } });
    // The image goes to Claude and nowhere else.
    expect(JSON.stringify(db.deepWorkScreenCheck.create.mock.calls)).not.toContain('QUJD');
  });

  it('nudges when off track and leaves no pending choice', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row());
    mockCheck.mockResolvedValue({ onTrack: false, note: 'YouTube', message: 'You seem off your plan.' });
    await screenCheck(post('screen-check', goodBody), params);
    expect(db.deepWorkMessage.create.mock.calls[0][0].data.content).toContain('stays shared');
    expect(db.deepWorkSession.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { pendingShareChoice: false } });
  });

  it('refuses a check that is not due', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ nextScreenCheckAt: new Date('2026-11-27T03:45:00Z') }));
    expect((await screenCheck(post('screen-check', goodBody), params)).status).toBe(409);
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('refuses when sharing is off or the session is wrapping up', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ screenShareOn: false }));
    expect((await screenCheck(post('screen-check', goodBody), params)).status).toBe(409);
    db.deepWorkSession.findUnique.mockResolvedValue(row({ status: 'WRAPPING_UP' }));
    expect((await screenCheck(post('screen-check', goodBody), params)).status).toBe(409);
  });

  it('runs once when two tabs send the same check', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row());
    db.deepWorkSession.updateMany.mockResolvedValue({ count: 0 });
    expect((await screenCheck(post('screen-check', goodBody), params)).status).toBe(409);
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('skips the AI call when there is no plan yet', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ plan: null }));
    const res = await screenCheck(post('screen-check', goodBody), params);
    expect((await res.json()).skipped).toBe(true);
    expect(mockCheck).not.toHaveBeenCalled();
    expect(db.deepWorkSession.updateMany).toHaveBeenCalled();
  });

  it('rejects a bad image', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row());
    expect((await screenCheck(post('screen-check', { ...goodBody, image: 'hello' }), params)).status).toBe(400);
  });
});

describe('POST /screen-share', () => {
  it('schedules the first check when sharing starts', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ screenShareOn: false, nextScreenCheckAt: null }));
    await screenShare(post('screen-share', { action: 'started' }), params);
    const data = db.deepWorkSession.update.mock.calls[0][0].data;
    expect(data.screenShareOn).toBe(true);
    expect(data.nextScreenCheckAt.toISOString()).toBe('2026-11-27T04:00:00.000Z');
  });

  it('keeps a pending check after a refresh', async () => {
    const pending = new Date('2026-11-27T03:40:00Z');
    db.deepWorkSession.findUnique.mockResolvedValue(row({ screenShareOn: false, nextScreenCheckAt: pending }));
    await screenShare(post('screen-share', { action: 'started' }), params);
    expect(db.deepWorkSession.update.mock.calls[0][0].data.nextScreenCheckAt).toBe(pending);
  });

  it('gives an overdue check one frame interval instead of skipping it', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ screenShareOn: false, nextScreenCheckAt: new Date('2026-11-27T03:00:00Z') }));
    await screenShare(post('screen-share', { action: 'started' }), params);
    expect(db.deepWorkSession.update.mock.calls[0][0].data.nextScreenCheckAt.toISOString()).toBe('2026-11-27T03:35:00.000Z');
  });

  it('turns sharing off when the student chooses to', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ pendingShareChoice: true }));
    await screenShare(post('screen-share', { action: 'turn_off' }), params);
    expect(db.deepWorkSession.update.mock.calls[0][0].data).toEqual({ pendingShareChoice: false, screenShareOn: false });
    expect(db.deepWorkMessage.create).toHaveBeenCalledTimes(2);
  });

  it('ignores a choice when no question is pending', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row({ pendingShareChoice: false }));
    await screenShare(post('screen-share', { action: 'keep' }), params);
    expect(db.deepWorkMessage.create).not.toHaveBeenCalled();
  });

  it('rejects unknown actions', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(row());
    expect((await screenShare(post('screen-share', { action: 'explode' }), params)).status).toBe(400);
  });
});
