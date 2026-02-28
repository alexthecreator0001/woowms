import { Request, Response, NextFunction } from 'express';
import { tenantPrisma } from '../lib/prisma.js';

/**
 * Reads tenantId from the JWT (set by authenticate middleware)
 * and attaches a tenant-scoped Prisma client to req.prisma.
 */
export function injectTenant(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({
      error: true,
      message: 'No tenant associated with this account',
      code: 'NO_TENANT',
    });
    return;
  }

  req.tenantId = tenantId;
  req.prisma = tenantPrisma(tenantId);
  next();
}
