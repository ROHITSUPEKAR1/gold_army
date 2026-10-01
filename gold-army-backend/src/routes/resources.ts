import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { allowRoles, requireAuth } from '../middleware/auth';
import { failure, success } from '../utils/response';

export const resourceRouter = Router();
const id = z.object({ id: z.string().min(1) });
const adminTrainer = allowRoles('ADMIN', 'TRAINER');

// ==================== PAYMENTS & PAYMENT GATEWAY ====================
resourceRouter.get('/payments', requireAuth, async (req, res) => {
  const where = req.auth!.role === 'MEMBER' ? { member: { userId: req.auth!.sub } } : {};
  return success(
    res,
    await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true, service: true } },
        member: { include: { user: { select: { name: true, phone: true } } } },
      },
    })
  );
});

resourceRouter.get('/payments/:id', requireAuth, async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: id.parse(req.params).id },
    include: { subscription: true, member: true },
  });
  if (!payment) return failure(res, 'Payment not found', [], 404);
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (payment.memberId !== member?.id) return failure(res, 'Insufficient permissions', [], 403);
  }
  return success(res, payment);
});

// 1. Create Payment Order on Backend (Never trust amount from frontend)
resourceRouter.post('/payments/order', requireAuth, allowRoles('ADMIN', 'MEMBER'), async (req, res) => {
  const input = z
    .object({
      planId: z.string().min(1),
      serviceId: z.string().optional(),
      discount: z.number().nonnegative().default(0),
    })
    .parse(req.body);

  const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
  if (!member) return failure(res, 'Member profile not found', [], 404);

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId, isActive: true },
    include: { services: true },
  });
  if (!plan) return failure(res, 'Selected plan not found or inactive', [], 404);

  const serviceId = input.serviceId ?? plan.services[0]?.serviceId;
  if (!serviceId) return failure(res, 'No service associated with plan', [], 400);

  const rawAmount = Number(plan.price);
  const finalAmount = Math.max(0, rawAmount - input.discount);

  // Generate order identifier
  const orderId = `order_ga_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Record pending payment
  const payment = await prisma.payment.create({
    data: {
      memberId: member.id,
      amount: rawAmount,
      discount: input.discount,
      finalAmount,
      method: 'RAZORPAY',
      transactionId: orderId,
      status: 'PENDING',
    },
  });

  return success(res, {
    orderId,
    paymentId: payment.id,
    amount: finalAmount,
    amountInPaise: Math.round(finalAmount * 100),
    currency: 'INR',
    planId: plan.id,
    planName: plan.name,
    keyId: process.env.RAZORPAY_KEY_ID ?? 'rzp_test_goldarmy_prod',
  }, 201);
});

// 2. Server-side Payment Verification & Subscription Activation
resourceRouter.post('/payments/verify', requireAuth, allowRoles('ADMIN', 'MEMBER'), async (req, res) => {
  const input = z
    .object({
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
      planId: z.string().min(1),
      serviceId: z.string().optional(),
    })
    .parse(req.body);

  const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
  if (!member) return failure(res, 'Member profile not found', [], 404);

  // Validate Razorpay signature if live key secret is present
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret) {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest('hex');

    if (generatedSignature !== input.signature) {
      return failure(res, 'Payment verification failed: invalid signature.', [], 400);
    }
  }

  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id: input.planId },
    include: { services: true },
  });

  const targetServiceId = input.serviceId ?? plan.services[0]?.serviceId;
  if (!targetServiceId) return failure(res, 'Service not found for plan', [], 400);

  // Calculate Subscription Duration
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (plan.durationMonths) {
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);
  } else if (plan.durationDays) {
    endDate.setDate(endDate.getDate() + plan.durationDays);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  // Create or Update Subscription
  const subscription = await prisma.subscription.create({
    data: {
      memberId: member.id,
      planId: plan.id,
      serviceId: targetServiceId,
      startDate,
      endDate,
      status: 'ACTIVE',
    },
    include: { plan: true, service: true },
  });

  // Update Payment record to SUCCESSFUL
  const payment = await prisma.payment.updateMany({
    where: {
      memberId: member.id,
      transactionId: input.orderId,
    },
    data: {
      subscriptionId: subscription.id,
      status: 'SUCCESSFUL',
      transactionId: input.paymentId,
      paidAt: new Date(),
    },
  });

  // Generate confirmation notification for member
  await prisma.notification.create({
    data: {
      title: '🎉 Payment Successful!',
      message: `Your payment of ₹${Number(plan.price).toLocaleString('en-IN')} for ${plan.name} was verified. Your membership is now active until ${endDate.toLocaleDateString('en-IN')}.`,
      audience: 'SELECTED_MEMBERS',
      recipients: {
        create: [{ memberId: member.id }],
      },
    },
  });

  return success(res, {
    verified: true,
    subscription,
    message: 'Payment verified and membership activated successfully.',
  });
});

// 3. Webhook handler for asynchronous gateway event processing
resourceRouter.post('/payments/webhook', async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'] as string;

  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return failure(res, 'Invalid webhook signature', [], 400);
    }
  }

  const event = req.body.event;
  if (event === 'payment.captured') {
    const paymentEntity = req.body.payload?.payment?.entity;
    if (paymentEntity?.order_id) {
      await prisma.payment.updateMany({
        where: { transactionId: paymentEntity.order_id },
        data: { status: 'SUCCESSFUL', paidAt: new Date() },
      });
    }
  }

  return success(res, { received: true });
});

resourceRouter.post('/payments', requireAuth, allowRoles('ADMIN', 'MEMBER'), async (req, res) => {
  const input = z
    .object({
      memberId: z.string(),
      subscriptionId: z.string().optional(),
      amount: z.number().nonnegative(),
      discount: z.number().nonnegative().default(0),
      finalAmount: z.number().nonnegative(),
      method: z.enum(['CASH', 'UPI', 'CARD', 'RAZORPAY']),
      transactionId: z.string().optional(),
      status: z.enum(['PENDING', 'SUCCESSFUL', 'FAILED']).default('PENDING'),
    })
    .parse(req.body);
  return success(res, await prisma.payment.create({ data: input }), 201);
});

resourceRouter.post('/payments/:id/refund', requireAuth, allowRoles('ADMIN'), async (req, res) => {
  return success(
    res,
    await prisma.payment.update({
      where: { id: id.parse(req.params).id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    })
  );
});

resourceRouter.get('/exercises', requireAuth, async (_req, res) => success(res, await prisma.exercise.findMany({ orderBy: { name: 'asc' } })));
resourceRouter.get('/exercises/:id', requireAuth, async (req, res) => {
  const item = await prisma.exercise.findUnique({ where: { id: id.parse(req.params).id } });
  if (!item) return failure(res, 'Exercise not found', [], 404);
  return success(res, item);
});
resourceRouter.post('/exercises', requireAuth, adminTrainer, async (req, res) => { const input = z.object({ name: z.string(), targetMuscle: z.string(), difficulty: z.string(), instructions: z.string().optional(), videoUrl: z.string().url().optional(), imageUrl: z.string().url().optional() }).parse(req.body); return success(res, await prisma.exercise.create({ data: input }), 201); });
resourceRouter.put('/exercises/:id', requireAuth, adminTrainer, async (req, res) => success(res, await prisma.exercise.update({ where: { id: id.parse(req.params).id }, data: req.body })));
resourceRouter.delete('/exercises/:id', requireAuth, allowRoles('ADMIN'), async (req, res) => success(res, await prisma.exercise.delete({ where: { id: id.parse(req.params).id } })));
resourceRouter.get('/workouts', requireAuth, async (_req, res) => success(res, await prisma.workout.findMany({ where: { isDeleted: false }, include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } })));
resourceRouter.get('/workouts/:id', requireAuth, async (req, res) => {
  const workout = await prisma.workout.findUnique({
    where: { id: id.parse(req.params).id, isDeleted: false },
    include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } }, trainer: { include: { user: { select: { name: true } } } } },
  });
  if (!workout) return failure(res, 'Workout not found', [], 404);
  return success(res, workout);
});
resourceRouter.post('/workouts', requireAuth, adminTrainer, async (req, res) => {
  const input = z
    .object({
      name: z.string().min(1),
      goal: z.string().min(1),
      notes: z.string().optional(),
      durationMin: z.number().int().positive().optional(),
      calories: z.number().int().positive().optional(),
      exercises: z
        .array(
          z.object({
            exerciseId: z.string().min(1),
            order: z.number().int().positive().default(1),
            sets: z.number().int().positive().default(3),
            reps: z.number().int().positive().default(10),
            weight: z.string().optional(),
            restSec: z.number().int().nonnegative().optional(),
            trainerNotes: z.string().optional(),
          })
        )
        .optional(),
    })
    .parse(req.body);

  const trainer = req.auth!.role === 'TRAINER' ? await prisma.trainer.findUnique({ where: { userId: req.auth!.sub } }) : null;
  const workout = await prisma.workout.create({
    data: {
      name: input.name,
      goal: input.goal,
      notes: input.notes,
      durationMin: input.durationMin,
      calories: input.calories,
      trainerId: trainer?.id,
      exercises: input.exercises?.length
        ? {
            create: input.exercises.map((e, index) => ({
              exerciseId: e.exerciseId,
              order: e.order ?? index + 1,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              restSec: e.restSec,
              trainerNotes: e.trainerNotes,
            })),
          }
        : undefined,
    },
    include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
  });
  return success(res, workout, 201);
});
resourceRouter.put('/workouts/:id', requireAuth, adminTrainer, async (req, res) => success(res, await prisma.workout.update({ where: { id: id.parse(req.params).id }, data: req.body })));
resourceRouter.delete('/workouts/:id', requireAuth, adminTrainer, async (req, res) => success(res, await prisma.workout.update({ where: { id: id.parse(req.params).id }, data: { isDeleted: true } })));
resourceRouter.post('/workouts/:id/assign', requireAuth, adminTrainer, async (req, res) => { const input = z.object({ memberId: z.string() }).parse(req.body); return success(res, await prisma.memberWorkout.create({ data: { workoutId: id.parse(req.params).id, memberId: input.memberId } }), 201); });
resourceRouter.post('/workouts/:id/complete', requireAuth, async (req, res) => {
  let memberId = req.body?.memberId as string | undefined;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return failure(res, 'Member profile not found', [], 404);
    memberId = member.id;
  }
  if (!memberId) return failure(res, 'memberId is required', [], 400);

  const updated = await prisma.memberWorkout.update({
    where: { memberId_workoutId: { memberId, workoutId: id.parse(req.params).id } },
    data: { completedAt: new Date() },
    include: { workout: true },
  });
  return success(res, updated);
});
resourceRouter.get('/members/:id/workouts', requireAuth, async (req, res) => {
  const memberId = id.parse(req.params).id;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (member?.id !== memberId) return failure(res, 'Insufficient permissions', [], 403);
  }
  return success(res, await prisma.memberWorkout.findMany({ where: { memberId }, include: { workout: { include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } } } }));
});

resourceRouter.get('/diet-plans', requireAuth, async (_req, res) => success(res, await prisma.dietPlan.findMany({ where: { isDeleted: false }, include: { meals: true } })));
resourceRouter.get('/diet-plans/:id', requireAuth, async (req, res) => {
  const plan = await prisma.dietPlan.findUnique({
    where: { id: id.parse(req.params).id, isDeleted: false },
    include: { meals: true, trainer: { include: { user: { select: { name: true } } } } },
  });
  if (!plan) return failure(res, 'Diet plan not found', [], 404);
  return success(res, plan);
});
resourceRouter.post('/diet-plans', requireAuth, adminTrainer, async (req, res) => {
  const input = z
    .object({
      name: z.string().min(1),
      goal: z.string().min(1),
      dietType: z.enum(['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN']),
      calories: z.number().int().positive(),
      proteinG: z.number().int().positive(),
      carbsG: z.number().int().positive(),
      fatsG: z.number().int().positive(),
      budget: z.number().nonnegative().optional(),
      meals: z
        .array(
          z.object({
            mealType: z.string(),
            timing: z.string(),
            name: z.string(),
            quantity: z.string().optional(),
            calories: z.number().int().positive(),
            proteinG: z.number().int().nonnegative(),
            estimatedCost: z.number().nonnegative().optional(),
            preparationNotes: z.string().optional(),
          })
        )
        .optional(),
    })
    .parse(req.body);

  const trainer = req.auth!.role === 'TRAINER' ? await prisma.trainer.findUnique({ where: { userId: req.auth!.sub } }) : null;
  const dietPlan = await prisma.dietPlan.create({
    data: {
      name: input.name,
      goal: input.goal,
      dietType: input.dietType,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatsG: input.fatsG,
      budget: input.budget,
      trainerId: trainer?.id,
      meals: input.meals?.length
        ? {
            create: input.meals,
          }
        : undefined,
    },
    include: { meals: true },
  });
  return success(res, dietPlan, 201);
});
resourceRouter.put('/diet-plans/:id', requireAuth, adminTrainer, async (req, res) => success(res, await prisma.dietPlan.update({ where: { id: id.parse(req.params).id }, data: req.body })));
resourceRouter.delete('/diet-plans/:id', requireAuth, adminTrainer, async (req, res) => success(res, await prisma.dietPlan.update({ where: { id: id.parse(req.params).id }, data: { isDeleted: true } })));
resourceRouter.post('/diet-plans/:id/assign', requireAuth, adminTrainer, async (req, res) => { const input = z.object({ memberId: z.string() }).parse(req.body); return success(res, await prisma.memberDietPlan.create({ data: { dietPlanId: id.parse(req.params).id, memberId: input.memberId } }), 201); });
resourceRouter.get('/members/:id/diet', requireAuth, async (req, res) => {
  const memberId = id.parse(req.params).id;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (member?.id !== memberId) return failure(res, 'Insufficient permissions', [], 403);
  }
  return success(res, await prisma.memberDietPlan.findMany({ where: { memberId }, include: { dietPlan: { include: { meals: true } } } }));
});

// ==================== PERSONAL TRAINING (PT) ====================
resourceRouter.get('/trainers', requireAuth, async (_req, res) => {
  const trainers = await prisma.trainer.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      _count: {
        select: { members: true, ptSessions: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return success(res, trainers);
});

resourceRouter.get('/pt/sessions', requireAuth, async (req, res) => {
  let where: any = {};
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return success(res, []);
    where.memberId = member.id;
  } else if (req.auth!.role === 'TRAINER') {
    const trainer = await prisma.trainer.findUnique({ where: { userId: req.auth!.sub } });
    if (!trainer) return success(res, []);
    where.trainerId = trainer.id;
  } else if (req.auth!.role === 'ADMIN') {
    const { memberId, trainerId, status } = req.query;
    if (typeof memberId === 'string') where.memberId = memberId;
    if (typeof trainerId === 'string') where.trainerId = trainerId;
    if (typeof status === 'string') where.status = status;
  }

  const sessions = await prisma.ptSession.findMany({
    where,
    include: {
      member: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
      trainer: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
    },
    orderBy: { startsAt: 'desc' },
  });
  return success(res, sessions);
});

resourceRouter.post('/pt/sessions', requireAuth, allowRoles('ADMIN', 'TRAINER', 'MEMBER'), async (req, res) => {
  const input = z
    .object({
      memberId: z.string().optional(),
      trainerId: z.string(),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date().optional(),
      notes: z.string().max(500).optional(),
    })
    .parse(req.body);

  let targetMemberId = input.memberId;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return failure(res, 'Member profile not found', [], 404);
    targetMemberId = member.id;
  } else if (!targetMemberId) {
    return failure(res, 'memberId is required for booking', [], 400);
  }

  const trainer = await prisma.trainer.findUnique({ where: { id: input.trainerId, isActive: true } });
  if (!trainer) return failure(res, 'Trainer not found or inactive', [], 404);

  // Compute endsAt (default 1 hour if not specified)
  const endsAt = input.endsAt ?? new Date(input.startsAt.getTime() + 60 * 60 * 1000);

  // Check for scheduling collision on trainer
  const collision = await prisma.ptSession.findFirst({
    where: {
      trainerId: input.trainerId,
      status: 'UPCOMING',
      startsAt: {
        gte: new Date(input.startsAt.getTime() - 45 * 60 * 1000),
        lte: new Date(input.startsAt.getTime() + 45 * 60 * 1000),
      },
    },
  });

  if (collision) {
    return failure(res, 'Trainer is already booked for this time slot.', [], 409);
  }

  const session = await prisma.ptSession.create({
    data: {
      memberId: targetMemberId,
      trainerId: input.trainerId,
      startsAt: input.startsAt,
      endsAt,
      notes: input.notes,
      status: 'UPCOMING',
    },
    include: {
      member: { include: { user: { select: { id: true, name: true } } } },
      trainer: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return success(res, session, 201);
});

resourceRouter.put('/pt/sessions/:id', requireAuth, allowRoles('ADMIN', 'TRAINER', 'MEMBER'), async (req, res) => {
  const sessionId = id.parse(req.params).id;
  const existing = await prisma.ptSession.findUnique({
    where: { id: sessionId },
    include: { member: true, trainer: true },
  });

  if (!existing) return failure(res, 'PT session not found', [], 404);

  if (req.auth!.role === 'MEMBER' && existing.member.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }
  if (req.auth!.role === 'TRAINER' && existing.trainer.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }

  const input = z
    .object({
      startsAt: z.coerce.date().optional(),
      endsAt: z.coerce.date().optional(),
      notes: z.string().max(500).optional(),
    })
    .parse(req.body);

  const updated = await prisma.ptSession.update({
    where: { id: sessionId },
    data: input,
    include: {
      member: { include: { user: { select: { id: true, name: true } } } },
      trainer: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return success(res, updated);
});

resourceRouter.post('/pt/sessions/:id/complete', requireAuth, allowRoles('ADMIN', 'TRAINER'), async (req, res) => {
  const sessionId = id.parse(req.params).id;
  const existing = await prisma.ptSession.findUnique({
    where: { id: sessionId },
    include: { trainer: true },
  });

  if (!existing) return failure(res, 'PT session not found', [], 404);
  if (req.auth!.role === 'TRAINER' && existing.trainer.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }

  const input = z.object({ notes: z.string().max(500).optional() }).parse(req.body || {});

  const updated = await prisma.ptSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      notes: input.notes ?? existing.notes,
    },
    include: {
      member: { include: { user: { select: { id: true, name: true } } } },
      trainer: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return success(res, updated);
});

resourceRouter.post('/pt/sessions/:id/cancel', requireAuth, allowRoles('ADMIN', 'TRAINER', 'MEMBER'), async (req, res) => {
  const sessionId = id.parse(req.params).id;
  const existing = await prisma.ptSession.findUnique({
    where: { id: sessionId },
    include: { member: true, trainer: true },
  });

  if (!existing) return failure(res, 'PT session not found', [], 404);

  if (req.auth!.role === 'MEMBER' && existing.member.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }
  if (req.auth!.role === 'TRAINER' && existing.trainer.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }

  const updated = await prisma.ptSession.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED' },
    include: {
      member: { include: { user: { select: { id: true, name: true } } } },
      trainer: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return success(res, updated);
});

resourceRouter.delete('/pt/sessions/:id', requireAuth, allowRoles('ADMIN'), async (req, res) => {
  const sessionId = id.parse(req.params).id;
  const updated = await prisma.ptSession.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED' },
  });
  return success(res, updated);
});

resourceRouter.get('/progress/:memberId', requireAuth, async (req, res) => {
  const memberId = id.parse({ id: req.params.memberId }).id;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (member?.id !== memberId) return failure(res, 'Insufficient permissions', [], 403);
  }
  return success(
    res,
    await prisma.progress.findMany({
      where: { memberId },
      orderBy: { measuredAt: 'desc' },
    })
  );
});

resourceRouter.post('/progress', requireAuth, allowRoles('ADMIN', 'TRAINER', 'MEMBER'), async (req, res) => {
  const input = z
    .object({
      memberId: z.string().optional(),
      measuredAt: z.coerce.date().optional(),
      weightKg: z.number().positive().max(300).optional(),
      bodyFat: z.number().positive().max(60).optional(),
      measurements: z
        .object({
          chestIn: z.number().positive().optional(),
          waistIn: z.number().positive().optional(),
          armsIn: z.number().positive().optional(),
          thighsIn: z.number().positive().optional(),
          hipsIn: z.number().positive().optional(),
          shouldersIn: z.number().positive().optional(),
        })
        .optional(),
      photoUrls: z.array(z.string().url()).optional(),
      notes: z.string().max(500).optional(),
      personalRecords: z
        .record(
          z.string(),
          z.object({
            exerciseName: z.string(),
            weightKg: z.number().positive(),
            reps: z.number().int().positive(),
            date: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .optional(),
    })
    .parse(req.body);

  let targetMemberId = input.memberId;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return failure(res, 'Member profile not found', [], 404);
    targetMemberId = member.id;
  } else if (!targetMemberId) {
    return failure(res, 'memberId is required for trainer/admin entry', [], 400);
  }

  const record = await prisma.progress.create({
    data: {
      memberId: targetMemberId,
      measuredAt: input.measuredAt ?? new Date(),
      weightKg: input.weightKg,
      bodyFat: input.bodyFat,
      measurements: (input.measurements as any) ?? undefined,
      photoUrls: input.photoUrls ?? undefined,
      notes: input.notes,
      personalRecords: (input.personalRecords as any) ?? undefined,
    },
  });

  // Also update member's current weight in Member profile if provided
  if (input.weightKg) {
    await prisma.member.update({
      where: { id: targetMemberId },
      data: { weightKg: input.weightKg },
    });
  }

  return success(res, record, 201);
});

resourceRouter.put('/progress/:id', requireAuth, allowRoles('ADMIN', 'TRAINER', 'MEMBER'), async (req, res) => {
  const targetId = id.parse(req.params).id;
  const existing = await prisma.progress.findUnique({ where: { id: targetId }, include: { member: true } });
  if (!existing) return failure(res, 'Progress entry not found', [], 404);
  if (req.auth!.role === 'MEMBER' && existing.member.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }

  const input = z
    .object({
      weightKg: z.number().positive().max(300).optional(),
      bodyFat: z.number().positive().max(60).optional(),
      measurements: z.record(z.string(), z.any()).optional(),
      photoUrls: z.array(z.string().url()).optional(),
      notes: z.string().max(500).optional(),
      personalRecords: z.record(z.string(), z.any()).optional(),
    })
    .parse(req.body);

  const updated = await prisma.progress.update({
    where: { id: targetId },
    data: input as any,
  });
  return success(res, updated);
});

// ==================== NOTIFICATIONS ====================
resourceRouter.get('/notifications', requireAuth, async (req, res) => {
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return success(res, []);

    const recipients = await prisma.notificationRecipient.findMany({
      where: { memberId: member.id },
      include: {
        notification: {
          include: {
            createdBy: { select: { name: true, role: true } },
          },
        },
      },
      orderBy: { notification: { createdAt: 'desc' } },
    });

    const formatted = recipients.map((r) => ({
      id: r.notification.id,
      title: r.notification.title,
      message: r.notification.message,
      audience: r.notification.audience,
      createdAt: r.notification.createdAt,
      readAt: r.readAt,
      isRead: Boolean(r.readAt),
      createdBy: r.notification.createdBy?.name ?? 'Gold Army Admin',
    }));

    return success(res, formatted);
  }

  // Admin / Trainer view
  const notifications = await prisma.notification.findMany({
    include: {
      createdBy: { select: { name: true, role: true } },
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(res, notifications);
});

resourceRouter.post('/notifications', requireAuth, allowRoles('ADMIN'), async (req, res) => {
  const input = z
    .object({
      title: z.string().min(2).max(100),
      message: z.string().min(2).max(1000),
      audience: z.enum([
        'ALL_MEMBERS',
        'SELECTED_MEMBERS',
        'EXPIRING_MEMBERS',
        'EXPIRED_MEMBERS',
        'SPECIFIC_SERVICE',
        'SPECIFIC_PLAN',
      ]),
      memberIds: z.array(z.string()).default([]),
      planId: z.string().optional(),
      serviceId: z.string().optional(),
      scheduledAt: z.coerce.date().optional(),
    })
    .parse(req.body);

  let targetMemberIds: string[] = [];

  if (input.audience === 'SELECTED_MEMBERS' && input.memberIds.length > 0) {
    targetMemberIds = input.memberIds;
  } else if (input.audience === 'EXPIRING_MEMBERS') {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiringSubs = await prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { lte: sevenDaysFromNow, gte: new Date() },
      },
      select: { memberId: true },
    });
    targetMemberIds = Array.from(new Set(expiringSubs.map((s) => s.memberId)));
  } else if (input.audience === 'EXPIRED_MEMBERS') {
    const expiredSubs = await prisma.subscription.findMany({
      where: { status: 'EXPIRED' },
      select: { memberId: true },
    });
    targetMemberIds = Array.from(new Set(expiredSubs.map((s) => s.memberId)));
  } else if (input.audience === 'SPECIFIC_PLAN' && input.planId) {
    const planSubs = await prisma.subscription.findMany({
      where: { planId: input.planId, status: 'ACTIVE' },
      select: { memberId: true },
    });
    targetMemberIds = Array.from(new Set(planSubs.map((s) => s.memberId)));
  } else if (input.audience === 'SPECIFIC_SERVICE' && input.serviceId) {
    const serviceSubs = await prisma.subscription.findMany({
      where: { serviceId: input.serviceId, status: 'ACTIVE' },
      select: { memberId: true },
    });
    targetMemberIds = Array.from(new Set(serviceSubs.map((s) => s.memberId)));
  } else {
    // ALL_MEMBERS default
    const members = await prisma.member.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    targetMemberIds = members.map((m) => m.id);
  }

  // If no members matched, fallback to all active members so notification has audience
  if (targetMemberIds.length === 0) {
    const all = await prisma.member.findMany({ where: { isActive: true }, select: { id: true } });
    targetMemberIds = all.map((m) => m.id);
  }

  const notification = await prisma.notification.create({
    data: {
      title: input.title,
      message: input.message,
      audience: input.audience,
      scheduledAt: input.scheduledAt,
      createdById: req.auth!.sub,
      recipients: {
        create: targetMemberIds.map((memberId) => ({ memberId })),
      },
    },
    include: {
      _count: { select: { recipients: true } },
    },
  });

  return success(res, notification, 201);
});

// Automation endpoint to trigger expiry reminders (7d, 3d, 1d, 0d)
resourceRouter.post('/notifications/trigger-expiry-alerts', requireAuth, allowRoles('ADMIN'), async (_req, res) => {
  const today = new Date();
  const intervals = [
    { days: 7, label: '7 days' },
    { days: 3, label: '3 days' },
    { days: 1, label: 'tomorrow' },
    { days: 0, label: 'today' },
  ];

  let totalAlertsSent = 0;

  for (const interval of intervals) {
    const targetDateStart = new Date(today.getTime() + interval.days * 24 * 60 * 60 * 1000);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDateStart.getTime() + 24 * 60 * 60 * 1000);

    const subs = await prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { gte: targetDateStart, lt: targetDateEnd },
      },
      include: {
        member: { include: { user: true } },
        plan: true,
      },
    });

    for (const sub of subs) {
      const dedupeKey = `EXPIRY_${sub.id}_${interval.days}D_${targetDateStart.toISOString().slice(0, 10)}`;

      // Check if already logged
      const existingLog = await prisma.notificationLog.findUnique({ where: { dedupeKey } });
      if (!existingLog) {
        const notif = await prisma.notification.create({
          data: {
            title: interval.days === 0 ? '⚠️ Membership Expires Today!' : `Membership Notice: Expires in ${interval.label}`,
            message: `Hi ${sub.member.user.name}, your ${sub.plan.name} subscription will expire ${interval.days === 0 ? 'today' : `in ${interval.label}`}. Renew now to maintain uninterrupted club access.`,
            audience: 'EXPIRING_MEMBERS',
            recipients: {
              create: [{ memberId: sub.memberId }],
            },
          },
        });

        await prisma.notificationLog.create({
          data: {
            dedupeKey,
            channel: 'IN_APP',
            notificationId: notif.id,
            userId: sub.member.userId,
          },
        });

        totalAlertsSent++;
      }
    }
  }

  return success(res, { message: `Automated expiry alerts processed. ${totalAlertsSent} new alerts generated.`, count: totalAlertsSent });
});

resourceRouter.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
  if (!member) return failure(res, 'Member not found', [], 404);

  const updated = await prisma.notificationRecipient.update({
    where: {
      notificationId_memberId: {
        notificationId: id.parse(req.params).id,
        memberId: member.id,
      },
    },
    data: { readAt: new Date() },
  });

  return success(res, updated);
});

resourceRouter.post('/notifications/mark-all-read', requireAuth, async (req, res) => {
  const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
  if (!member) return failure(res, 'Member not found', [], 404);

  await prisma.notificationRecipient.updateMany({
    where: { memberId: member.id, readAt: null },
    data: { readAt: new Date() },
  });

  return success(res, { message: 'All notifications marked as read' });
});

resourceRouter.delete('/notifications/:id', requireAuth, allowRoles('ADMIN'), async (req, res) => {
  const notifId = id.parse(req.params).id;
  await prisma.notification.delete({ where: { id: notifId } });
  return success(res, { message: 'Notification removed' });
});
