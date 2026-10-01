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

describe('Payments & Payment Gateway Integration Tests', () => {
  let memberToken: string;
  let adminToken: string;
  let selectedPlanId: string;
  let createdOrderId: string;
  let createdPaymentId: string;

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

    // 3. Get plans
    const plansRes = await fetch(`${baseUrl}/api/plans`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const plansData = await plansRes.json();
    selectedPlanId = plansData.data[0].id;
  });

  it('1. POST /api/payments/order — Creates server-side order with calculated price', async () => {
    const res = await fetch(`${baseUrl}/api/payments/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        planId: selectedPlanId,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('orderId');
    expect(body.data).toHaveProperty('amount');
    expect(body.data.amount).toBeGreaterThan(0);
    expect(body.data.currency).toBe('INR');

    createdOrderId = body.data.orderId;
    createdPaymentId = body.data.paymentId;
  });

  it('2. POST /api/payments/verify — Verifies payment and activates live subscription', async () => {
    const simulatedPaymentId = `pay_${Date.now()}_simulated`;
    const res = await fetch(`${baseUrl}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        orderId: createdOrderId,
        paymentId: simulatedPaymentId,
        signature: 'simulated_valid_test_signature',
        planId: selectedPlanId,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.verified).toBe(true);
    expect(body.data.subscription).toHaveProperty('id');
    expect(body.data.subscription.status).toBe('ACTIVE');
  });

  it('3. GET /api/payments — Member fetches payment history including newly verified payment', async () => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('4. POST /api/payments/webhook — Gateway webhook receives events safely', async () => {
    const res = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              order_id: createdOrderId,
              amount: 500000,
            },
          },
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('5. POST /api/payments/:id/refund — Admin refunds a transaction', async () => {
    const res = await fetch(`${baseUrl}/api/payments/${createdPaymentId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('REFUNDED');
  });

  it('6. Role restriction — Member cannot refund transactions (403)', async () => {
    const res = await fetch(`${baseUrl}/api/payments/${createdPaymentId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('7. Unauthenticated request rejection — 401', async () => {
    const res = await fetch(`${baseUrl}/api/payments`);
    expect(res.status).toBe(401);
  });
});
