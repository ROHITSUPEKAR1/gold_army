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

describe('Plans & Subscription Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let plans: Array<{ id: string; name: string; price: number }>;

  beforeAll(async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+919822104000',
        password: 'GoldArmy123!',
      }),
    });
    const loginData = await loginRes.json();
    memberToken = loginData.data.accessToken;
    memberId = loginData.data.user.memberId;
  });

  it('should fetch active plans catalog (GET /api/plans)', async () => {
    const res = await fetch(`${baseUrl}/api/plans`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(5);
    plans = body.data;
  });

  it('should create a new subscription (POST /api/subscriptions)', async () => {
    const targetPlan = plans.find((p) => p.id === 'plan-gym-cardio-q') ?? plans[0];
    const res = await fetch(`${baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        planId: targetPlan.id,
        paymentMethod: 'UPI',
        autoActivate: true,
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.memberId).toBe(memberId);
    expect(body.data.planId).toBe(targetPlan.id);
    expect(body.data.status).toBe('ACTIVE');
    expect(body.data.daysRemaining).toBeGreaterThan(0);
  });

  it('should reject non-existent plan ID with 404', async () => {
    const res = await fetch(`${baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        planId: 'non-existent-plan-id-12345',
      }),
    });

    expect(res.status).toBe(404);
  });

  it('should renew an active subscription (POST /api/subscriptions/:id/renew)', async () => {
    const res = await fetch(`${baseUrl}/api/subscriptions/seed-subscription/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ACTIVE');
    expect(body.data.daysRemaining).toBeGreaterThan(0);
    expect(body.data.payments.length).toBeGreaterThan(0);
  });
});
