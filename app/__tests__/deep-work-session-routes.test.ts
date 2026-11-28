jest.mock('@/db', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    deepWorkSlotSignup: { findMany: jest.fn() },
    deepWorkSession: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    deepWorkMessage: { create: jest.fn(), findMany: jest.fn() },
    deepWorkScreenCheck: { count: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));
jest.mock('@/app/lib/api-user-helper', () => ({ getUserIdForRequest: jest.fn() }));
jest.mock('@/app/lib/deep-work/ai-host', () => ({ runHostTurn: jest.fn(), anthropicConfigured: jest.fn(() => true) }));

import { NextRequest } from 'next/server';
import { POST as join } from '@/app/api/deep-work/sessions/join/route';
import { POST as postMessage } from '@/app/api/deep-work/sessions/[id]/messages/route';
import { POST as end } from '@/app/api/deep-work/sessions/[id]/end/route';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';
import { runHostTurn } from '@/app/lib/deep-work/ai-host';
import { prisma } from '@/db';

const db = prisma as unknown as {
  user: { findUnique: jest.Mock };
  deepWorkSlotSignup: { findMany: jest.Mock };
  deepWorkSession: Record<'findUnique' | 'findUniqueOrThrow' | 'findFirst' | 'create' | 'update' | 'updateMany', jest.Mock>;
  deepWorkMessage: Record<'create' | 'findMany', jest.Mock>;
  deepWorkScreenCheck: { count: jest.Mock };
};
const mockHost = runHostTurn as jest.Mock;

const BASE = 'http://localhost/api/deep-work/sessions';
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const req = (url: string, body?: unknown) =>
  new NextRequest(url, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    userId: 'user-1',
    slotKey: 'thu-18',
    scheduledStart: new Date('2026-11-27T02:00:00Z'),
    scheduledEnd: new Date('2026-11-27T04:00:00Z'),
    status: 'ACTIVE',
    plan: null,
    summary: null,
    wrapUpAt: null,
    endedAt: null,
    livekitRoom: 'dw-s1',
    messages: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  (getUserIdForRequest as jest.Mock).mockResolvedValue({ userId: 'user-1', error: null });
  db.user.findUnique.mockResolvedValue({ name: 'Sam Lee' });
  db.deepWorkMessage.findMany.mockResolvedValue([]);
  db.deepWorkScreenCheck.count.mockResolvedValue(0);
  delete process.env.LIVEKIT_URL;
});

describe('POST /api/deep-work/sessions/join', () => {
  it('refuses outside the join window', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-27T01:30:00Z') });
    db.deepWorkSlotSignup.findMany.mockResolvedValue([{ slotKey: 'thu-18' }]);
    const res = await join(req(`${BASE}/join`, {}));
    expect(res.status).toBe(409);
    expect(db.deepWorkSession.create).not.toHaveBeenCalled();
  });

  it('creates the session with the opening message 10 minutes early', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-27T01:52:00Z') });
    db.deepWorkSlotSignup.findMany.mockResolvedValue([{ slotKey: 'thu-18' }]);
    db.deepWorkSession.findUnique.mockResolvedValue(null);
    db.deepWorkSession.create.mockImplementation(({ data }) => Promise.resolve({ id: data.id }));
    const res = await join(req(`${BASE}/join`, {}));
    expect(res.status).toBe(200);
    const data = db.deepWorkSession.create.mock.calls[0][0].data;
    expect(data.scheduledStart.toISOString()).toBe('2026-11-27T02:00:00.000Z');
    expect(data.livekitRoom).toBe(`dw-${data.id}`);
    expect(data.messages.create.content).toMatch(/^Hi Sam!/);
    expect((await res.json()).sessionId).toBe(data.id);
  });

  it('reuses an existing session row', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-27T02:30:00Z') });
    db.deepWorkSlotSignup.findMany.mockResolvedValue([{ slotKey: 'thu-18' }]);
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow());
    const res = await join(req(`${BASE}/join`, {}));
    expect((await res.json()).sessionId).toBe('s1');
    expect(db.deepWorkSession.create).not.toHaveBeenCalled();
  });

  it('refuses practice sessions unless practice mode is on', async () => {
    delete process.env.DEEP_WORK_PRACTICE_MODE;
    expect((await join(req(`${BASE}/join`, { practice: true }))).status).toBe(403);
  });

  it('starts a new practice session once the last one was ended', async () => {
    process.env.DEEP_WORK_PRACTICE_MODE = 'true';
    db.deepWorkSession.findFirst.mockResolvedValue(null);
    db.deepWorkSession.findUnique.mockResolvedValue(null);
    db.deepWorkSession.create.mockImplementation(({ data }) => Promise.resolve({ id: data.id }));
    const res = await join(req(`${BASE}/join`, { practice: true }));
    expect(res.status).toBe(200);
    // Only a still-running practice session is reused; one in wrap-up is not.
    expect(db.deepWorkSession.findFirst.mock.calls[0][0].where.status).toBe('ACTIVE');
    expect(db.deepWorkSession.create).toHaveBeenCalled();
    delete process.env.DEEP_WORK_PRACTICE_MODE;
  });

  it('refuses the instructor userId parameter', async () => {
    expect((await join(req(`${BASE}/join?userId=user-2`, {}))).status).toBe(403);
  });
});

describe('POST /api/deep-work/sessions/[id]/messages', () => {
  it('saves the plan the host captured', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow());
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ plan: 'Send 5 applications' }));
    mockHost.mockResolvedValue({ reply: 'Go for it.', plan: 'Send 5 applications', summary: null });
    const res = await postMessage(req(`${BASE}/s1/messages`, { content: 'Send 5 applications' }), params('s1'));
    expect(res.status).toBe(200);
    expect(mockHost.mock.calls[0][0].phase).toBe('planning');
    expect(db.deepWorkMessage.create).toHaveBeenCalledWith({ data: { sessionId: 's1', role: 'STUDENT', content: 'Send 5 applications' } });
    expect(db.deepWorkSession.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { plan: 'Send 5 applications' } });
  });

  it('completes the session when the summary is captured', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP', plan: 'x' }));
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ status: 'COMPLETED' }));
    mockHost.mockResolvedValue({ reply: 'Great work.', plan: null, summary: 'Sent 4 of 5.' });
    await postMessage(req(`${BASE}/s1/messages`, { content: 'Sent 4' }), params('s1'));
    expect(db.deepWorkSession.update.mock.calls[0][0].data).toMatchObject({ summary: 'Sent 4 of 5.', status: 'COMPLETED' });
  });

  it('ignores a plan change during the summary phase', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP' }));
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP' }));
    mockHost.mockResolvedValue({ reply: 'What did you finish?', plan: 'new plan', summary: null });
    await postMessage(req(`${BASE}/s1/messages`, { content: 'hmm' }), params('s1'));
    expect(db.deepWorkSession.update).not.toHaveBeenCalled();
  });

  it("returns 404 for another student's session", async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ userId: 'user-2' }));
    expect((await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'))).status).toBe(404);
  });

  it('refuses messages after the session is done', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ status: 'COMPLETED' }));
    expect((await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'))).status).toBe(409);
    expect(mockHost).not.toHaveBeenCalled();
  });

  it('keeps the student message and answers 502 when the AI call fails', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow());
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow());
    mockHost.mockRejectedValue(new Error('overloaded'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'));
    expect(res.status).toBe(502);
    expect(db.deepWorkMessage.create).toHaveBeenCalledTimes(1);
  });
});

describe('required screen sharing', () => {
  beforeEach(() => {
    process.env.LIVEKIT_URL = 'wss://x.livekit.cloud';
    process.env.LIVEKIT_API_KEY = 'k';
    process.env.LIVEKIT_API_SECRET = 's';
  });
  afterEach(() => {
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
  });

  it('blocks chat until the student shares', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ screenShareOn: false }));
    const res = await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'));
    expect(res.status).toBe(403);
    expect(mockHost).not.toHaveBeenCalled();
  });

  it('allows chat while sharing', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ screenShareOn: true }));
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow());
    mockHost.mockResolvedValue({ reply: 'ok', plan: null, summary: null });
    expect((await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'))).status).toBe(200);
  });

  it('allows chat without sharing after an on-track check', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ screenShareOn: false }));
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow());
    db.deepWorkScreenCheck.count.mockResolvedValue(1);
    mockHost.mockResolvedValue({ reply: 'ok', plan: null, summary: null });
    expect((await postMessage(req(`${BASE}/s1/messages`, { content: 'hi' }), params('s1'))).status).toBe(200);
  });

  it('never blocks the summary step', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP', screenShareOn: false }));
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP' }));
    mockHost.mockResolvedValue({ reply: 'What did you finish?', plan: null, summary: null });
    expect((await postMessage(req(`${BASE}/s1/messages`, { content: 'done' }), params('s1'))).status).toBe(200);
  });
});

describe('POST /api/deep-work/sessions/[id]/end', () => {
  it('moves to wrap-up once and posts the summary question', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow({ plan: 'Send 5 applications' }));
    db.deepWorkSession.updateMany.mockResolvedValue({ count: 1 });
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP' }));
    const res = await end(req(`${BASE}/s1/end`), params('s1'));
    expect(res.status).toBe(200);
    expect(db.deepWorkSession.updateMany.mock.calls[0][0].where).toEqual({ id: 's1', status: 'ACTIVE' });
    expect(db.deepWorkMessage.create.mock.calls[0][0].data.content).toContain('"Send 5 applications"');
  });

  it('does not post the question twice when another tab already ended it', async () => {
    db.deepWorkSession.findUnique.mockResolvedValue(sessionRow());
    db.deepWorkSession.updateMany.mockResolvedValue({ count: 0 });
    db.deepWorkSession.findUniqueOrThrow.mockResolvedValue(sessionRow({ status: 'WRAPPING_UP' }));
    await end(req(`${BASE}/s1/end`), params('s1'));
    expect(db.deepWorkMessage.create).not.toHaveBeenCalled();
  });
});
