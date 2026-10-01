import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { failure, success } from '../utils/response';
import type { Request, Response } from 'express';
import { idSchema } from './core';

export function subscriptionStatus(endDate: Date, now = new Date()) {
  const days = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
  return {
    daysRemaining: days,
    status: days < 0 ? 'EXPIRED' : days <= 7 ? 'EXPIRING_SOON' : 'ACTIVE',
  } as const;
}

export function calculateStreak(records: Array<{ checkInDate: Date }>) {
  if (!records.length) return { currentStreak: 0, longestStreak: 0 };
  const dates = Array.from(
    new Set(
      records.map((r) => {
        const d = new Date(r.checkInDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const oneDayMs = 86400000;

  let currentStreak = 0;
  let longestStreak = 0;

  if (dates.length > 0) {
    const mostRecent = dates[0];
    const diffFromToday = Math.round((todayMs - mostRecent) / oneDayMs);
    if (diffFromToday === 0 || diffFromToday === 1) {
      currentStreak = 1;
      let expectedPrev = mostRecent - oneDayMs;
      for (let i = 1; i < dates.length; i++) {
        if (Math.abs(dates[i] - expectedPrev) <= 1000) {
          currentStreak++;
          expectedPrev -= oneDayMs;
        } else {
          break;
        }
      }
    }
  }

  for (let i = 0; i < dates.length; i++) {
    let tempStreak = 1;
    let expected = dates[i] - oneDayMs;
    for (let j = i + 1; j < dates.length; j++) {
      if (Math.abs(dates[j] - expected) <= 1000) {
        tempStreak++;
        expected -= oneDayMs;
      } else {
        break;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  return { currentStreak, longestStreak: Math.max(currentStreak, longestStreak) };
}

export async function listSubscriptions(req: Request, res: Response) {
  const where =
    req.auth!.role === 'MEMBER'
      ? { member: { userId: req.auth!.sub }, isDeleted: false }
      : { isDeleted: false };
  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      plan: true,
      service: true,
      payments: { orderBy: { createdAt: 'desc' } },
      member: { include: { user: { select: { name: true, phone: true } } } },
    },
    orderBy: { endDate: 'desc' },
  });
  return success(
    res,
    subscriptions.map((item) => ({ ...item, ...subscriptionStatus(item.endDate) }))
  );
}

export async function createSubscription(req: Request, res: Response) {
  const input = z
    .object({
      memberId: z.string().optional(),
      planId: z.string().min(1),
      serviceId: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      discount: z.number().nonnegative().default(0),
      paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'RAZORPAY']).default('UPI'),
      autoActivate: z.boolean().default(true),
    })
    .parse(req.body);

  let targetMemberId = input.memberId;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (!member) return failure(res, 'Member profile not found', [], 404);
    targetMemberId = member.id;
  } else if (!targetMemberId) {
    return failure(res, 'memberId is required for admin creation', [], 400);
  }

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId, isActive: true },
    include: { services: { include: { service: true } } },
  });
  if (!plan) return failure(res, 'This membership plan is no longer available.', [], 404);

  const fallbackService = await prisma.service.findFirst({ where: { isActive: true } });
  const targetServiceId = input.serviceId ?? plan.services[0]?.serviceId ?? fallbackService?.id;
  if (!targetServiceId) return failure(res, 'No service associated with this plan', [], 400);

  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  let endDate = input.endDate ? new Date(input.endDate) : new Date(startDate);
  if (!input.endDate) {
    if (plan.durationMonths) {
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    } else if (plan.durationDays) {
      endDate.setDate(endDate.getDate() + plan.durationDays);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }
  }

  const finalAmount = Math.max(0, Number(plan.price) - input.discount);
  const status = input.autoActivate ? 'ACTIVE' : 'PAYMENT_PENDING';

  const subscription = await prisma.subscription.create({
    data: {
      memberId: targetMemberId!,
      planId: plan.id,
      serviceId: targetServiceId,
      startDate,
      endDate,
      discount: input.discount,
      status,
      payments: input.autoActivate
        ? {
            create: {
              memberId: targetMemberId!,
              amount: Number(plan.price),
              discount: input.discount,
              finalAmount,
              method: input.paymentMethod,
              status: 'SUCCESSFUL',
              paidAt: new Date(),
              transactionId: `GA-SUB-${Date.now()}`,
            },
          }
        : undefined,
    },
    include: { plan: true, service: true, payments: true },
  });

  return success(res, { ...subscription, ...subscriptionStatus(subscription.endDate) }, 201);
}

export async function updateSubscription(req: Request, res: Response) {
  const { id } = idSchema.parse(req.params);
  const input = z
    .object({
      planId: z.string().optional(),
      serviceId: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z.enum(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN', 'PAYMENT_PENDING']).optional(),
    })
    .parse(req.body);
  return success(res, await prisma.subscription.update({ where: { id }, data: input }));
}

export async function renewSubscription(req: Request, res: Response) {
  const { id } = idSchema.parse(req.params);
  const current = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true, member: true },
  });
  if (!current) return failure(res, 'Subscription not found', [], 404);
  if (req.auth!.role === 'MEMBER' && current.member.userId !== req.auth!.sub) {
    return failure(res, 'Insufficient permissions', [], 403);
  }

  const startDate = current.endDate > new Date() ? current.endDate : new Date();
  const endDate = new Date(startDate);
  if (current.plan.durationMonths) {
    endDate.setMonth(endDate.getMonth() + current.plan.durationMonths);
  } else if (current.plan.durationDays) {
    endDate.setDate(endDate.getDate() + current.plan.durationDays);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  const finalAmount = Number(current.plan.price);
  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      startDate,
      endDate,
      status: 'ACTIVE',
      payments: {
        create: {
          memberId: current.memberId,
          amount: finalAmount,
          finalAmount,
          method: 'UPI',
          status: 'SUCCESSFUL',
          paidAt: new Date(),
          transactionId: `GA-REN-${Date.now()}`,
        },
      },
    },
    include: { plan: true, service: true, payments: true },
  });

  return success(res, { ...updated, ...subscriptionStatus(updated.endDate) });
}

export async function extendSubscription(req: Request, res: Response) {
  const { id } = idSchema.parse(req.params);
  const days = z.object({ days: z.number().int().positive().max(365) }).parse(req.body).days;
  const current = await prisma.subscription.findUniqueOrThrow({ where: { id } });
  const endDate = new Date(current.endDate);
  endDate.setDate(endDate.getDate() + days);
  return success(res, await prisma.subscription.update({ where: { id }, data: { endDate, status: 'ACTIVE' } }));
}

export async function freezeSubscription(req: Request, res: Response) {
  const { id } = idSchema.parse(req.params);
  const until = z.object({ until: z.coerce.date() }).parse(req.body).until;
  return success(res, await prisma.subscription.update({ where: { id }, data: { status: 'FROZEN', frozenAt: new Date(), frozenUntil: until } }));
}

export async function checkIn(req: Request, res: Response) {
  const input = z.object({ qrToken: z.string().min(1), serviceId: z.string().optional() }).parse(req.body);
  if (input.qrToken !== env.GYM_QR_SECRET) return failure(res, 'Invalid gym QR code.', [], 400);

  const member = await prisma.member.findUnique({
    where: { userId: req.auth!.sub },
    include: {
      subscriptions: {
        where: { isDeleted: false, status: { in: ['ACTIVE', 'EXPIRING_SOON'] }, endDate: { gte: new Date() } },
        take: 1,
      },
    },
  });

  if (!member) return failure(res, 'Member profile not found', [], 404);
  if (!member.subscriptions.length) {
    return failure(res, 'Your membership does not allow gym access. Please activate or renew your subscription.', [], 403);
  }

  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  try {
    const attendance = await prisma.attendance.create({
      data: {
        memberId: member.id,
        serviceId: input.serviceId ?? member.subscriptions[0].serviceId,
        checkInDate: date,
        checkInTime: today,
        method: 'QR',
      },
      include: { service: true },
    });

    const allRecords = await prisma.attendance.findMany({
      where: { memberId: member.id },
    });
    const streakInfo = calculateStreak(allRecords);

    return success(
      res,
      {
        attendance,
        ...streakInfo,
        totalVisits: allRecords.length,
        message: 'Check-in recorded successfully.',
      },
      201
    );
  } catch {
    return failure(res, 'Attendance already recorded today.', [], 409);
  }
}

export async function memberAttendance(req: Request, res: Response) {
  const memberId = z.string().parse(req.params.memberId);
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.auth!.sub } });
    if (member?.id !== memberId) return failure(res, 'Insufficient permissions', [], 403);
  }
  return success(
    res,
    await prisma.attendance.findMany({
      where: { memberId },
      include: { service: true },
      orderBy: { checkInTime: 'desc' },
    })
  );
}

export async function attendanceStats(req: Request, res: Response) {
  let memberId = req.query.memberId as string | undefined;
  if (req.auth!.role === 'MEMBER') {
    const member = await prisma.member.findUniqueOrThrow({ where: { userId: req.auth!.sub } });
    memberId = member.id;
  }
  if (!memberId) return failure(res, 'memberId is required', [], 400);

  const records = await prisma.attendance.findMany({
    where: { memberId },
    orderBy: { checkInDate: 'desc' },
  });

  const streak = calculateStreak(records);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthVisits = records.filter((r) => new Date(r.checkInDate) >= startOfMonth).length;

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  const hasAttendedToday = records.some((r) => {
    const dStr = new Date(r.checkInDate).toISOString().split('T')[0];
    return dStr === todayDateStr;
  });

  // Past 7 days checkins
  const past7Days: Array<{ date: string; attended: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const attended = records.some((r) => new Date(r.checkInDate).toISOString().split('T')[0] === dStr);
    past7Days.push({ date: d.toISOString(), attended });
  }

  return success(res, {
    totalVisits: records.length,
    thisMonthVisits,
    hasAttendedToday,
    attendancePercentage: records.length ? Math.min(100, Math.round((thisMonthVisits / 24) * 100)) : 0,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    past7Days,
  });
}

export async function adminAttendance(_req: Request, res: Response) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfWeek = new Date(start);
  startOfWeek.setUTCDate(start.getUTCDate() - 6);
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [todayCount, weeklyCount, monthlyCount, recentRecords] = await Promise.all([
    prisma.attendance.count({ where: { checkInDate: { gte: start } } }),
    prisma.attendance.count({ where: { checkInDate: { gte: startOfWeek } } }),
    prisma.attendance.count({ where: { checkInDate: { gte: startOfMonth } } }),
    prisma.attendance.findMany({
      take: 20,
      orderBy: { checkInTime: 'desc' },
      include: {
        service: true,
        member: { include: { user: { select: { name: true, phone: true } } } },
      },
    }),
  ]);

  return success(res, {
    todayCount,
    weeklyCount,
    monthlyCount,
    recentRecords,
  });
}

export async function dashboard(_req: Request, res: Response) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const month = new Date(start.getFullYear(), start.getMonth(), 1);
  const [
    totalMembers,
    activeMembers,
    expiringMembers,
    expiredMembers,
    todayAttendance,
    ptSessionsToday,
    todayRevenue,
    monthlyRevenue,
    recentActivity,
  ] = await Promise.all([
    prisma.member.count({ where: { isActive: true } }),
    prisma.subscription.count({ where: { status: 'ACTIVE', isDeleted: false } }),
    prisma.subscription.count({
      where: { endDate: { gte: start, lte: new Date(start.getTime() + 7 * 86400000) }, isDeleted: false },
    }),
    prisma.subscription.count({ where: { endDate: { lt: start }, isDeleted: false } }),
    prisma.attendance.count({ where: { checkInDate: start } }),
    prisma.ptSession.count({ where: { startsAt: { gte: start, lt: new Date(start.getTime() + 86400000) } } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: start }, status: 'SUCCESSFUL' }, _sum: { finalAmount: true } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: month }, status: 'SUCCESSFUL' }, _sum: { finalAmount: true } }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
  ]);
  return success(res, {
    totalMembers,
    activeMembers,
    expiringMembers,
    expiredMembers,
    todayAttendance,
    ptSessionsToday,
    todayRevenue: todayRevenue._sum.finalAmount ?? 0,
    monthlyRevenue: monthlyRevenue._sum.finalAmount ?? 0,
    recentActivity,
  });
}

export async function expiry(_req: Request, res: Response) {
  const now = new Date();
  const groups = await Promise.all(
    [0, 1, 3, 7].map(async (days) => {
      const from = new Date(now);
      from.setDate(from.getDate() + days);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return {
        days,
        members: await prisma.subscription.findMany({
          where: { endDate: { gte: from, lt: to }, isDeleted: false },
          include: { member: { include: { user: { select: { name: true, phone: true } } } }, plan: true },
        }),
      };
    })
  );
  return success(res, {
    groups,
    expired: await prisma.subscription.findMany({
      where: { endDate: { lt: now }, isDeleted: false },
      include: { member: { include: { user: { select: { name: true, phone: true } } } }, plan: true },
    }),
  });
}
