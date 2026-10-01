import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/config/prisma';
import { calculateStreak } from '../src/modules/business';
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

describe('Live Attendance & QR Check-in Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let adminToken: string;
  let trainerToken: string;

  beforeAll(async () => {
    // 1. Member login
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
    memberId = memberData.data.user.memberId;

    // 2. Admin login
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

    // 3. Trainer login
    const trainerLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'trainer@goldarmy.local',
        password: 'GoldArmy123!',
      }),
    });
    const trainerData = await trainerLogin.json();
    trainerToken = trainerData.data.accessToken;

    // Clear today's attendance for member to test freshly
    const today = new Date();
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    await prisma.attendance.deleteMany({
      where: {
        memberId,
        checkInDate: date,
      },
    });
  });

  it('calculates consecutive streak correctly in unit logic', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const streakResult = calculateStreak([
      { checkInDate: today },
      { checkInDate: yesterday },
      { checkInDate: twoDaysAgo },
      { checkInDate: fiveDaysAgo },
      { checkInDate: sixDaysAgo },
    ]);

    expect(streakResult.currentStreak).toBe(3);
    expect(streakResult.longestStreak).toBe(3);
  });

  it('rejects unauthenticated QR check-in request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken: env.GYM_QR_SECRET }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects invalid gym QR code with 400', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ qrToken: 'invalid-fake-qr-code-payload' }),
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.message).toContain('Invalid gym QR code');
  });

  it('successfully records check-in with valid gym QR secret (POST /api/attendance/check-in)', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ qrToken: env.GYM_QR_SECRET }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.attendance).toBeDefined();
    expect(body.data.attendance.memberId).toBe(memberId);
    expect(body.data.attendance.method).toBe('QR');
    expect(body.data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(body.data.totalVisits).toBeGreaterThanOrEqual(1);
  });

  it('prevents duplicate check-in on the same day with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ qrToken: env.GYM_QR_SECRET }),
    });

    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.message).toContain('Attendance already recorded');
  });

  it('fetches member attendance history (GET /api/attendance/member/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/member/${memberId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].memberId).toBe(memberId);
    expect(body.data[0].service).toBeDefined();
  });

  it('fetches member attendance stats (GET /api/attendance/stats)', async () => {
    const res = await fetch(`${baseUrl}/api/attendance/stats`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalVisits).toBeGreaterThanOrEqual(1);
    expect(body.data.hasAttendedToday).toBe(true);
    expect(body.data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(body.data.past7Days.length).toBe(7);
  });

  it('allows Admin to view gym-wide attendance summary (GET /api/admin/attendance)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.todayCount).toBeGreaterThanOrEqual(1);
    expect(body.data.weeklyCount).toBeGreaterThanOrEqual(1);
    expect(body.data.recentRecords.length).toBeGreaterThanOrEqual(1);
  });

  it('restricts non-admin from accessing admin attendance endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/admin/attendance`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(403);
  });
});
