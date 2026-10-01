import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '@prisma/client';

export type AccessClaims = { sub: string; role: Role; email?: string; phone?: string };
export function signAccessToken(claims: AccessClaims) { return jwt.sign(claims, env.JWT_SECRET, { expiresIn: '15m' }); }
export function signRefreshToken(userId: string) { return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' }); }
export function verifyAccessToken(token: string) { return jwt.verify(token, env.JWT_SECRET) as AccessClaims; }
export function verifyRefreshToken(token: string) { return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }; }
