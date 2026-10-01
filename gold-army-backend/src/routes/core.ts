import { Router } from 'express';
import { allowRoles, requireAuth } from '../middleware/auth';
import * as core from '../modules/core';

export const coreRouter = Router();
coreRouter.get('/members', requireAuth, core.listMembers);
coreRouter.get('/members/:id', requireAuth, core.getMember);
coreRouter.post('/members', requireAuth, core.adminOnly, core.createMember);
coreRouter.put('/members/:id', requireAuth, allowRoles('ADMIN', 'TRAINER'), core.updateMember);
coreRouter.patch('/members/:id/status', requireAuth, core.adminOnly, core.statusMember);
coreRouter.delete('/members/:id', requireAuth, core.adminOnly, core.deleteMember);
coreRouter.get('/services', core.listServices);
coreRouter.post('/services', requireAuth, core.adminOnly, core.createService);
coreRouter.put('/services/:id', requireAuth, core.adminOnly, core.updateService);
coreRouter.delete('/services/:id', requireAuth, core.adminOnly, core.deleteService);
coreRouter.get('/plans', core.listPlans);
coreRouter.post('/plans', requireAuth, core.adminOnly, core.createPlan);
coreRouter.put('/plans/:id', requireAuth, core.adminOnly, core.updatePlan);
coreRouter.delete('/plans/:id', requireAuth, core.adminOnly, core.deletePlan);
