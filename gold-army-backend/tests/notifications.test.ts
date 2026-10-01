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

describe('Notifications & Automated Communication Integration Tests', () => {
  let memberToken: string;
  let adminToken: string;
  let trainerToken: string;
  let createdNotificationId: string;

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
  });

  it('1. POST /api/notifications — Admin composes and broadcasts notification', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'New Olympic Lifting Platforms Installed',
        message: 'We have installed 3 new Eleiko competition platforms in the powerlifting zone.',
        audience: 'ALL_MEMBERS',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Olympic Lifting Platforms Installed');
    expect(body.data._count.recipients).toBeGreaterThan(0);

    createdNotificationId = body.data.id;
  });

  it('2. GET /api/notifications — Member receives broadcast notification in notification center', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((n: any) => n.id === createdNotificationId)).toBe(true);
  });

  it('3. PATCH /api/notifications/:id/read — Member marks notification as read', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/${createdNotificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('4. POST /api/notifications/mark-all-read — Member marks all unread notifications as read', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('5. POST /api/notifications/trigger-expiry-alerts — Admin runs expiry automation check', async () => {
    const res = await fetch(`${baseUrl}/api/notifications/trigger-expiry-alerts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('count');
  });

  it('6. Role restriction — Member cannot compose admin notifications (403)', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized announcement',
        message: 'This should fail',
        audience: 'ALL_MEMBERS',
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('7. Unauthenticated request rejection — 401 on missing token', async () => {
    const res = await fetch(`${baseUrl}/api/notifications`);
    expect(res.status).toBe(401);
  });
});
