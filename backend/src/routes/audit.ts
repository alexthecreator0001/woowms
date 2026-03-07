import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/audit — paginated, filterable audit log
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { resource, action, from, to } = req.query as Record<string, string | undefined>;

    const where: any = { tenantId };
    if (resource) where.resource = resource;
    if (action) where.action = { contains: action };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
