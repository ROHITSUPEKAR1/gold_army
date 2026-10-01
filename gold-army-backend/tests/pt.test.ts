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

describe('Personal Training (PT) Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let trainerToken: string;
  let trainerId: string;
  let adminToken: string;
  let createdSessionId: string;

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

    // 2. Trainer login
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
    trainerId = trainerData.data.user.trainerId;

    // 3. Admin login
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
  });

  it('1. GET /api/trainers — Fetches list of active certified trainers', async () => {
    const res = await fetch(`${baseUrl}/api/trainers`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const firstTrainer = body.data[0];
    expect(firstTrainer).toHaveProperty('id');
    expect(firstTrainer.user).toHaveProperty('name');
    if (!trainerId) {
      trainerId = firstTrainer.id;
    }
  });

  it('2. POST /api/pt/sessions — Member books 1-on-1 session with Trainer', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours in future
    const res = await fetch(`${baseUrl}/api/pt/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        trainerId,
        startsAt: futureDate.toISOString(),
        notes: 'Squat & Deadlift form assessment',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('UPCOMING');
    expect(body.data.notes).toBe('Squat & Deadlift form assessment');
    expect(body.data.memberId).toBe(memberId);

    createdSessionId = body.data.id;
  });

  it('3. POST /api/pt/sessions — Rejects duplicate/overlapping booking on trainer (409 Conflict)', async () => {
    const sameDate = new Date(Date.now() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000); // 5 mins later
    const res = await fetch(`${baseUrl}/api/pt/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        trainerId,
        startsAt: sameDate.toISOString(),
        notes: 'Conflicting session',
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('4. GET /api/pt/sessions — Member fetches own booked sessions', async () => {
    const res = await fetch(`${baseUrl}/api/pt/sessions`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((s: any) => s.id === createdSessionId)).toBe(true);
  });

  it('5. POST /api/pt/sessions/:id/complete — Trainer marks session as completed with notes', async () => {
    const res = await fetch(`${baseUrl}/api/pt/sessions/${createdSessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({
        notes: 'Completed 5x5 squats with solid depth. Core stability improved.',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('COMPLETED');
    expect(body.data.notes).toContain('Completed 5x5 squats');
  });

  it('6. POST /api/pt/sessions/:id/cancel — Member cancels a newly scheduled session', async () => {
    // Book a second session to cancel
    const cancelTargetDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const bookRes = await fetch(`${baseUrl}/api/pt/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        trainerId,
        startsAt: cancelTargetDate.toISOString(),
      }),
    });
    const sessionToCancel = await bookRes.json();
    expect(bookRes.status).toBe(201);

    const cancelRes = await fetch(`${baseUrl}/api/pt/sessions/${sessionToCancel.data.id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });

    expect(cancelRes.status).toBe(200);
    const cancelBody = await cancelRes.json();
    expect(cancelBody.success).toBe(true);
    expect(cancelBody.data.status).toBe('CANCELLED');
  });

  it('7. GET /api/pt/sessions — Admin retrieves all gym PT sessions', async () => {
    const res = await fetch(`${baseUrl}/api/pt/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('8. Unauthenticated request — 401 on missing JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/pt/sessions`);
    expect(res.status).toBe(401);
  });
});
