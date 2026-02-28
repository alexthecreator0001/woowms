import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import type { ZoneType } from '@prisma/client';

const router = Router();

// GET /api/v1/warehouse
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await req.prisma!.warehouse.findMany({
      include: { zones: { include: { bins: true } } },
    });
    res.json({ data: warehouses });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse
router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, isDefault } = req.body as { name: string; address?: string; isDefault?: boolean };
    const warehouse = await req.prisma!.warehouse.create({
      data: { name, address, isDefault },
    });
    res.status(201).json({ data: warehouse });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/:id/zones
router.post('/:id/zones', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, description } = req.body as { name: string; type: ZoneType; description?: string };

    // Verify warehouse belongs to tenant
    const warehouse = await req.prisma!.warehouse.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    const zone = await req.prisma!.zone.create({
      data: { warehouseId: parseInt(req.params.id), name, type, description },
    });
    res.status(201).json({ data: zone });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/zones/:zoneId/bins
router.post('/zones/:zoneId/bins', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, row, shelf, position, capacity } = req.body as {
      label: string;
      row?: string;
      shelf?: string;
      position?: string;
      capacity?: number;
    };
    const bin = await req.prisma!.bin.create({
      data: { zoneId: parseInt(req.params.zoneId), label, row, shelf, position, capacity },
    });
    res.status(201).json({ data: bin });
  } catch (err) {
    next(err);
  }
});

export default router;
