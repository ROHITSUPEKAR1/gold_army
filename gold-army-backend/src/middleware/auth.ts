import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken, type AccessClaims } from '../utils/jwt';
import { failure } from '../utils/response';

declare global { namespace Express { interface Request { auth?: AccessClaims } } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return failure(res, 'Authentication required', [], 401);
  try { req.auth = verifyAccessToken(header.slice(7)); next(); } catch { return failure(res, 'Invalid or expired token', [], 401); }
}

export function allowRoles(...roles: Role[]) { return (req: Request, res: Response, next: NextFunction) => { if (!req.auth || !roles.includes(req.auth.role)) return failure(res, 'Insufficient permissions', [], 403); next(); }; }
