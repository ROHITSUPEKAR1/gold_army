import { Router } from 'express';
import { authHandlers } from '../modules/auth';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();
authRouter.post('/login', authHandlers.login);
authRouter.post('/register', authHandlers.register);
authRouter.post('/refresh', authHandlers.refresh);
authRouter.post('/logout', requireAuth, authHandlers.logout);
authRouter.get('/me', requireAuth, authHandlers.me);
authRouter.post('/forgot-password', (_req, res) => res.json({ success: true, data: { message: 'Password reset flow is ready for mail/SMS provider integration.' } }));
authRouter.post('/reset-password', (_req, res) => res.json({ success: true, data: { message: 'Password reset provider integration required.' } }));
