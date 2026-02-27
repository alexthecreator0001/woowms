import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/warehouse
router.get('/', authenticate, async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { zones: { include: { bins: true } } },
    });
    res.json({ data: warehouses });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, address, isDefault } = req.body;
    const warehouse = await prisma.warehouse.create({
      data: { name, address, isDefault },
    });
    res.status(201).json({ data: warehouse });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/:id/zones
router.post('/:id/zones', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    const zone = await prisma.zone.create({
      data: { warehouseId: parseInt(req.params.id), name, type, description },
    });
    res.status(201).json({ data: zone });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/zones/:zoneId/bins
router.post('/zones/:zoneId/bins', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { label, row, shelf, position, capacity } = req.body;
    const bin = await prisma.bin.create({
      data: { zoneId: parseInt(req.params.zoneId), label, row, shelf, position, capacity },
    });
    res.status(201).json({ data: bin });
  } catch (err) {
    next(err);
  }
});

export default router;
