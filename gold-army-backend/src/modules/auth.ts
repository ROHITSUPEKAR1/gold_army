import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { failure, success } from '../utils/response';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';

const credentials = z
  .object({
    identifier: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.identifier || data.phone || data.email), {
    message: 'Identifier, phone, or email is required',
  });

const registration = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['MEMBER', 'TRAINER']).default('MEMBER'),
});

export async function login(req: Request, res: Response) {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    return failure(res, 'Invalid login payload', parsed.error.issues, 400);
  }

  const input = parsed.data;
  const rawId = (input.identifier ?? input.phone ?? input.email)!.trim();
  const isEmail = rawId.includes('@');

  // Flexible phone matching (e.g. +919822104000 or 9822104000)
  const phoneVariants = isEmail
    ? []
    : [rawId, rawId.startsWith('+91') ? rawId.slice(3) : `+91${rawId}`];

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(isEmail ? [{ email: rawId }] : []),
        ...phoneVariants.map((p) => ({ phone: p })),
        { email: rawId },
      ],
      status: 'ACTIVE',
    },
    include: {
      member: { select: { id: true, isActive: true } },
      trainer: { select: { id: true, isActive: true } },
    },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return failure(res, 'Invalid credentials. Please check your phone/email and password.', [], 401);
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
  });
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
  });

  return success(res, {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: user.role.toLowerCase(),
      phone: user.phone,
      email: user.email,
      memberId: user.member?.id,
      trainerId: user.trainer?.id,
    },
  });
}

export async function register(req: Request, res: Response) {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success) {
    return failure(res, 'Invalid registration payload', parsed.error.issues, 400);
  }
  const input = parsed.data;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const isEmail = input.identifier.includes('@');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: isEmail ? undefined : input.identifier,
      email: isEmail ? input.identifier : undefined,
      passwordHash,
      role: input.role as Role,
      member: input.role === 'MEMBER' ? { create: {} } : undefined,
      trainer: input.role === 'TRAINER' ? { create: {} } : undefined,
    },
  });

  return success(res, { id: user.id, name: user.name, role: user.role.toLowerCase() }, 201);
}

export async function refresh(req: Request, res: Response) {
  const parsed = z.object({ refreshToken: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    return failure(res, 'Refresh token is required', [], 400);
  }

  try {
    const claims = verifyRefreshToken(parsed.data.refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        member: { select: { id: true } },
        trainer: { select: { id: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE' || !user.refreshTokenHash) {
      return failure(res, 'Invalid or revoked session', [], 401);
    }

    const isValid = await bcrypt.compare(parsed.data.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      return failure(res, 'Invalid refresh token', [], 401);
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role.toLowerCase(),
        phone: user.phone,
        email: user.email,
        memberId: user.member?.id,
        trainerId: user.trainer?.id,
      },
    });
  } catch {
    return failure(res, 'Invalid or expired refresh token', [], 401);
  }
}

export async function me(req: Request, res: Response) {
  if (!req.auth?.sub) {
    return failure(res, 'Unauthorized', [], 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth.sub },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      status: true,
      member: { select: { id: true, isActive: true } },
      trainer: { select: { id: true, isActive: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return failure(res, 'User account not active', [], 401);
  }

  return success(res, {
    id: user.id,
    name: user.name,
    role: user.role.toLowerCase(),
    phone: user.phone,
    email: user.email,
    memberId: user.member?.id,
    trainerId: user.trainer?.id,
  });
}

export async function logout(req: Request, res: Response) {
  if (req.auth?.sub) {
    await prisma.user.update({
      where: { id: req.auth.sub },
      data: { refreshTokenHash: null },
    });
  }
  return success(res, { loggedOut: true });
}

export const authHandlers = { login, register, refresh, me, logout };
