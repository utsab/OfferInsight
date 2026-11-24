jest.mock('@/db', () => ({
  prisma: {
    deepWorkSlotSignup: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

jest.mock('@/app/lib/api-user-helper', () => ({
  getUserIdForRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/deep-work/schedule/route';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';
import { prisma } from '@/db';

const mockUser = getUserIdForRequest as jest.Mock;
const mockFindMany = prisma.deepWorkSlotSignup.findMany as jest.Mock;
const mockDeleteMany = prisma.deepWorkSlotSignup.deleteMany as jest.Mock;
const mockCreateMany = prisma.deepWorkSlotSignup.createMany as jest.Mock;

const URL_BASE = 'http://localhost/api/deep-work/schedule';

function put(body: unknown, url = URL_BASE) {
  return new NextRequest(url, { method: 'PUT', body: JSON.stringify(body) });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.mockResolvedValue({ userId: 'user-1', error: null });
});

describe('GET /api/deep-work/schedule', () => {
  it('returns 401 when signed out', async () => {
    mockUser.mockResolvedValue({ userId: null, error: 'Unauthorized' });
    const res = await GET(new NextRequest(URL_BASE));
    expect(res.status).toBe(401);
  });

  it('returns the saved slots in weekly order', async () => {
    mockFindMany.mockResolvedValue([{ slotKey: 'sun-12' }, { slotKey: 'mon-19' }]);
    const res = await GET(new NextRequest(URL_BASE));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.slotKeys).toEqual(['mon-19', 'sun-12']);
    expect(body.nextSession).not.toBeNull();
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
  });

  it('returns an empty schedule for a student who has not picked', async () => {
    mockFindMany.mockResolvedValue([]);
    const body = await (await GET(new NextRequest(URL_BASE))).json();
    expect(body).toMatchObject({ slotKeys: [], nextSession: null });
  });
});

describe('PUT /api/deep-work/schedule', () => {
  it('replaces the student picks', async () => {
    const res = await PUT(put({ slotKeys: ['thu-18', 'tue-14'] }));
    expect(res.status).toBe(200);
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', slotKey: 'thu-18' },
        { userId: 'user-1', slotKey: 'tue-14' },
      ],
    });
    expect((await res.json()).slotKeys).toEqual(['tue-14', 'thu-18']);
  });

  it('rejects an invalid pick without touching the database', async () => {
    const res = await PUT(put({ slotKeys: ['mon-19'] }));
    expect(res.status).toBe(400);
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it('rejects a malformed body', async () => {
    const req = new NextRequest(URL_BASE, { method: 'PUT', body: 'not json' });
    expect((await PUT(req)).status).toBe(400);
  });

  it('does not let anyone save picks for another user', async () => {
    const res = await PUT(put({ slotKeys: ['mon-19', 'tue-14'] }, `${URL_BASE}?userId=user-2`));
    expect(res.status).toBe(403);
    expect(mockUser).not.toHaveBeenCalled();
  });
});
