import { Request, Response, NextFunction } from 'express';
import type { AppError } from '../types/index.js';

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: true,
    message: (isProduction && status === 500) ? 'Internal server error' : (err.message || 'Internal server error'),
    code: err.code || 'INTERNAL_ERROR',
    ...(!isProduction && { stack: err.stack }),
  });
}
