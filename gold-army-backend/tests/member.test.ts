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

describe('Member & Membership API Integration Tests', () => {
  it('should authenticate Member and fetch live profile & subscriptions', async () => {
    // 1. Member Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+919822104000',
        password: 'GoldArmy123!',
      }),
    });
    const loginData = await loginRes.json();
    expect(loginRes.status).toBe(200);
    const { accessToken, user } = loginData.data;
    expect(user.memberId).toBeDefined();

    // 2. Fetch Member Profile
    const profileRes = await fetch(`${baseUrl}/api/members/${user.memberId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    expect(profileRes.status).toBe(200);
    expect(profileData.success).toBe(true);
    expect(profileData.data.user.name).toBe('Rohan Deshmukh');
    expect(profileData.data.fitnessGoal).toBe('Muscle Gain');
    expect(Number(profileData.data.heightCm)).toBe(178);
    expect(Number(profileData.data.weightKg)).toBeGreaterThan(0);
    expect(profileData.data.subscriptions.length).toBeGreaterThan(0);

    // 3. Fetch Subscriptions List
    const subRes = await fetch(`${baseUrl}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const subData = await subRes.json();
    expect(subRes.status).toBe(200);
    expect(subData.success).toBe(true);
    expect(subData.data.length).toBeGreaterThan(0);
    expect(subData.data[0].plan.name).toContain('Gold Quarterly');
    expect(subData.data[0].service.name).toBeDefined();
    expect(subData.data[0].daysRemaining).toBeDefined();
    expect(subData.data[0].status).toBeDefined();
  });
});
