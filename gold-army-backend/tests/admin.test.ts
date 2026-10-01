import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/app';
import type { Server } from 'http';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Admin Mobile Operations Integration Tests', () => {
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    // 1. Admin login
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'owner@goldarmy.local',
        password: 'GoldArmy123!',
      }),
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.data.accessToken;

    // 2. Member login
    const memberLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+919822104000',
        password: 'GoldArmy123!',
      }),
    });
    const memberData = await memberLogin.json();
    memberToken = memberData.data.accessToken;
  });

  it('1. GET /api/admin/dashboard — Admin retrieves live club metrics & revenue', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalMembers');
    expect(body.data).toHaveProperty('activeMembers');
    expect(body.data).toHaveProperty('todayAttendance');
    expect(body.data).toHaveProperty('monthlyRevenue');
  });

  it('2. GET /api/admin/expiry — Admin retrieves expiry groups (0d, 1d, 3d, 7d)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/expiry`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('groups');
    expect(Array.isArray(body.data.groups)).toBe(true);
    expect(body.data.groups.length).toBe(4);
  });

  it('3. GET /api/admin/attendance — Admin retrieves live gym attendance metrics', async () => {
    const res = await fetch(`${baseUrl}/api/admin/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('todayCount');
    expect(body.data).toHaveProperty('weeklyCount');
    expect(body.data).toHaveProperty('monthlyCount');
  });

  it('4. GET /api/members — Admin retrieves members list with subscriptions', async () => {
    const res = await fetch(`${baseUrl}/api/members`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('5. Role Authorization — Member cannot access admin dashboard (403)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('6. Unauthenticated request — 401 on missing token', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`);
    expect(res.status).toBe(401);
  });
});
