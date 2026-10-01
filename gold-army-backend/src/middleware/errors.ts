import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { failure } from '../utils/response';

export const notFound: RequestHandler = (req, res) => failure(res, `Route not found: ${req.method} ${req.path}`, [], 404);
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return failure(res, 'Validation failed', error.issues, 422);
  console.error(error);
  return failure(res, 'Internal server error', [], 500);
};
