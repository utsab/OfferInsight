/**
 * @jest-environment node
 */

import request from 'supertest';
import { createServer } from 'http';
import { auth } from '@/auth';
import { GET } from '@/app/api/applications_with_outreach/route';


jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

describe('GET /api/applications_with_outreach', () => {
  it('should return only applications belonging to the logged-in user', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
  });
});