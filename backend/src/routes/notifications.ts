import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/v1/notifications — list notifications (paginated, unread first)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantId = req.tenantId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where = { tenantId };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      data: notifications,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/unread-count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantId = req.tenantId!;

    const count = await prisma.notification.count({
      where: { tenantId, read: false },
    });

    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantId = req.tenantId!;
    const id = parseInt(req.params.id);

    await prisma.notification.updateMany({
      where: { id, tenantId },
      data: { read: true },
    });

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/read-all — mark all as read
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const tenantId = req.tenantId!;

    await prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
