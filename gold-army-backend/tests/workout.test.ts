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

describe('Live Workouts & Exercise Catalog Integration Tests', () => {
  let memberToken: string;
  let memberId: string;
  let trainerToken: string;
  let createdWorkoutId: string;
  let exerciseId: string;

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
  });

  it('fetches full exercise catalog (GET /api/exercises)', async () => {
    const res = await fetch(`${baseUrl}/api/exercises`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(10);
    exerciseId = body.data[0].id;
    expect(body.data[0].targetMuscle).toBeDefined();
    expect(body.data[0].difficulty).toBeDefined();
  });

  it('fetches specific exercise details by ID (GET /api/exercises/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/exercises/${exerciseId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(exerciseId);
    expect(body.data.name).toBeDefined();
  });

  it('returns 404 for non-existent exercise ID (GET /api/exercises/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/exercises/non-existent-ex-id`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(404);
  });

  it('fetches member assigned workouts (GET /api/members/:id/workouts)', async () => {
    const res = await fetch(`${baseUrl}/api/members/${memberId}/workouts`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].workout).toBeDefined();
    expect(body.data[0].workout.exercises.length).toBeGreaterThanOrEqual(1);
  });

  it('prevents member from viewing another member workouts (GET /api/members/:otherId/workouts)', async () => {
    const res = await fetch(`${baseUrl}/api/members/other-member-id-xyz/workouts`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('allows trainer to create a new workout routine (POST /api/workouts)', async () => {
    const res = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
      },
      body: JSON.stringify({
        name: 'Shoulder & Core Blast',
        goal: 'Hypertrophy',
        notes: 'Strict lateral raises and overhead lockouts.',
        durationMin: 40,
        calories: 320,
        exercises: [
          {
            exerciseId,
            order: 1,
            sets: 4,
            reps: 12,
            weight: '15 kg',
            restSec: 60,
            trainerNotes: 'Full focus on tempo.',
          },
        ],
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe('Shoulder & Core Blast');
    expect(body.data.exercises.length).toBe(1);
    createdWorkoutId = body.data.id;
  });

  it('allows trainer to assign workout to member (POST /api/workouts/:id/assign)', async () => {
    const res = await fetch(`${baseUrl}/api/workouts/${createdWorkoutId}/assign`, {
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

  it('fetches workout details by ID (GET /api/workouts/:id)', async () => {
    const res = await fetch(`${baseUrl}/api/workouts/${createdWorkoutId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(createdWorkoutId);
    expect(body.data.exercises.length).toBe(1);
  });

  it('allows member to complete assigned workout (POST /api/workouts/:id/complete)', async () => {
    const res = await fetch(`${baseUrl}/api/workouts/${createdWorkoutId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({}),
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.completedAt).toBeDefined();
  });
});
