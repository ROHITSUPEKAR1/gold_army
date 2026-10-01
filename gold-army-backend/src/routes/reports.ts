import { Router } from 'express';
import { allowRoles, requireAuth } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { success } from '../utils/response';

export const reportsRouter = Router();
reportsRouter.get('/:report', requireAuth, allowRoles('ADMIN'), async (req, res) => {
  const report = req.params.report;
  const data = report === 'members' ? await prisma.member.findMany({ include: { user: { select: { name: true, phone: true } } } })
    : report === 'attendance' ? await prisma.attendance.findMany({ orderBy: { checkInTime: 'desc' } })
      : report === 'revenue' || report === 'payments' ? await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } })
        : report === 'pt' ? await prisma.ptSession.findMany({ orderBy: { startsAt: 'desc' } })
          : await prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
  return success(res, { report, format: 'json', exportReady: true, data });
});
