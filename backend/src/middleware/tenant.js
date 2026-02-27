import { tenantPrisma } from '../lib/prisma.js';

/**
 * Reads tenantId from the JWT (set by authenticate middleware)
 * and attaches a tenant-scoped Prisma client to req.prisma.
 */
export function injectTenant(req, res, next) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({
      error: true,
      message: 'No tenant associated with this account',
      code: 'NO_TENANT',
    });
  }

  req.tenantId = tenantId;
  req.prisma = tenantPrisma(tenantId);
  next();
}
