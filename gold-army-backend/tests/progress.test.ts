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

describe('Live Progress & Personal Records Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let trainerToken: string;
  let adminToken: string;
  let createdProgressId: string;

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

  it('1. GET /api/progress/:memberId — Member retrieves own progress history', async () => {
    const res = await fetch(`${baseUrl}/api/progress/${memberId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);

    const firstEntry = json.data[0];
    expect(firstEntry).toHaveProperty('id');
    expect(firstEntry).toHaveProperty('memberId', memberId);
    expect(firstEntry).toHaveProperty('weightKg');
  });

  it('2. POST /api/progress — Member logs new body progress and measurements', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        weightKg: 77.5,
        bodyFat: 14.8,
        measurements: {
          chestIn: 41.5,
          waistIn: 31.0,
          armsIn: 15.5,
          thighsIn: 22.0,
        },
        notes: 'Consistent nutrition and strength training this week.',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Number(json.data.weightKg)).toBe(77.5);
    expect(Number(json.data.bodyFat)).toBe(14.8);
    expect(Number(json.data.measurements.chestIn)).toBe(41.5);
    expect(Number(json.data.measurements.waistIn)).toBe(31.0);
    expect(json.data.memberId).toBe(memberId);

    createdProgressId = json.data.id;
  });

  it('3. POST /api/progress — Member logs Personal Record (PR)', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        personalRecords: {
          bench_press: {
            exerciseName: 'Barbell Bench Press',
            weightKg: 100,
            reps: 5,
            notes: 'Hit a clean 5-rep set at 100kg!',
          },
          deadlift: {
            exerciseName: 'Barbell Deadlift',
            weightKg: 160,
            reps: 3,
            notes: 'Conventional stance PR',
          },
        },
        notes: 'PR test day.',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Number(json.data.personalRecords.bench_press.weightKg)).toBe(100);
    expect(Number(json.data.personalRecords.bench_press.reps)).toBe(5);
    expect(Number(json.data.personalRecords.deadlift.weightKg)).toBe(160);
  });

  it('4. PUT /api/progress/:id — Member updates their progress entry', async () => {
    const res = await fetch(`${baseUrl}/api/progress/${createdProgressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        weightKg: 77.2,
        notes: 'Adjusted post-morning weigh-in.',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Number(json.data.weightKg)).toBe(77.2);
    expect(json.data.notes).toBe('Adjusted post-morning weigh-in.');
  });

  it('5. Privacy / Security — Member cannot access another member progress (403)', async () => {
    const fakeOtherMemberId = 'fake-other-member-uuid-12345';
    const res = await fetch(`${baseUrl}/api/progress/${fakeOtherMemberId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('6. Validation — Rejects invalid or nonsensical progress values', async () => {
    // Negative weight
    const res1 = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        weightKg: -50,
      }),
    });
    expect([400, 422]).toContain(res1.status);

    // Extreme weight > 300kg
    const res2 = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        weightKg: 9999,
      }),
    });
    expect([400, 422]).toContain(res2.status);

    // Extreme body fat > 60%
    const res3 = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        bodyFat: 85,
      }),
    });
    expect([400, 422]).toContain(res3.status);
  });

  it('7. Trainer Authorization — Trainer can view member progress history', async () => {
    const res = await fetch(`${baseUrl}/api/progress/${memberId}`, {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('8. Admin Authorization — Admin can view member progress', async () => {
    const res = await fetch(`${baseUrl}/api/progress/${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('9. Unauthenticated rejection — 401 on missing JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/progress/${memberId}`);
    expect(res.status).toBe(401);
  });
});
