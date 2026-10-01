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

describe('Live Diet Plans & Daily Nutrition Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let trainerToken: string;
  let adminToken: string;
  let createdDietPlanId: string;

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

  it('fetches all diet plans (GET /api/diet-plans)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data[0].meals.length).toBeGreaterThanOrEqual(1);
  });

  it('fetches member assigned diet plans (GET /api/members/:id/diet)', async () => {
    const res = await fetch(`${baseUrl}/api/members/${memberId}/diet`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].dietPlan.calories).toBeGreaterThan(0);
    expect(body.data[0].dietPlan.meals.length).toBeGreaterThanOrEqual(1);
  });

  it('restricts member from viewing another member diet (GET /api/members/:otherId/diet)', async () => {
    const res = await fetch(`${baseUrl}/api/members/other-fake-member-id/diet`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('allows trainer to create a new diet plan with meals (POST /api/diet-plans)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({
        name: 'High Protein Eggetarian Bulking',
        goal: 'Muscle Gain',
        dietType: 'EGGETARIAN',
        calories: 2800,
        proteinG: 170,
        carbsG: 310,
        fatsG: 75,
        budget: 400,
        meals: [
          {
            mealType: 'BREAKFAST',
            timing: '8:30 AM',
            name: '4 Whole Boiled Eggs + 2 Parathas + Curd',
            quantity: '4 Eggs, 2 Parathas',
            calories: 600,
            proteinG: 32,
            estimatedCost: 70,
            preparationNotes: 'Cook parathas with minimal ghee.',
          },
          {
            mealType: 'LUNCH',
            timing: '1:30 PM',
            name: 'Egg Curry (3 Eggs) + Rice + Dal',
            quantity: '3 Eggs, 200g Rice',
            calories: 680,
            proteinG: 30,
            estimatedCost: 85,
            preparationNotes: 'Use tomato onion gravy.',
          },
        ],
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe('High Protein Eggetarian Bulking');
    expect(body.data.meals.length).toBe(2);
    createdDietPlanId = body.data.id;
  });

  it('allows trainer to assign diet plan to member (POST /api/diet-plans/:id/assign)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans/${createdDietPlanId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({ memberId }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('fetches specific diet plan by ID (GET /api/diet-plans/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans/${createdDietPlanId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdDietPlanId);
    expect(body.data.meals.length).toBe(2);
  });

  it('allows Admin to update diet plan (PUT /api/diet-plans/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans/${createdDietPlanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        calories: 2850,
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.calories).toBe(2850);
  });

  it('allows Admin to soft-delete diet plan (DELETE /api/diet-plans/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/diet-plans/${createdDietPlanId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isDeleted).toBe(true);
  });
});
