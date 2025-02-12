/**
 * @jest-environment node
 */

import request from 'supertest';
import { createServer } from 'http';
import { auth } from '@/auth';
import { GET } from '@/app/api/applications/route';


jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

describe('GET /api/applications', () => {
  it('should return only applications belonging to the logged-in user', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        email: 'utsab.k.saha@gmail.com',
      },
    });

    // const requestObj = {
    //   nextUrl: {
    //     searchParams: new URLSearchParams({ Id: '1' }),
    //   },
    // } as any;


    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
  });
});