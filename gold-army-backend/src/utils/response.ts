import type { Response } from 'express';

export function success<T>(res: Response, data: T, status = 200) { return res.status(status).json({ success: true, data }); }
export function failure(res: Response, message: string, errors: unknown[] = [], status = 400) { return res.status(status).json({ success: false, message, errors }); }
