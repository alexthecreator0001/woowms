import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import type { ZoneType } from '@prisma/client';

const router = Router();

// GET /api/v1/warehouse — list all warehouses with zones, bins, and stock counts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await req.prisma!.warehouse.findMany({
      include: {
        zones: {
          include: {
            bins: {
              include: {
                stockLocations: {
                  select: { quantity: true },
                },
              },
            },
          },
        },
      },
    });

    // Add _stockCount to each bin for convenience
    const data = warehouses.map((wh) => ({
      ...wh,
      zones: wh.zones.map((zone) => ({
        ...zone,
        bins: zone.bins.map((bin) => ({
          ...bin,
          _stockCount: bin.stockLocations.reduce((sum, sl) => sum + sl.quantity, 0),
        })),
      })),
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse — create warehouse
router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, isDefault } = req.body as { name: string; address?: string; isDefault?: boolean };

    // If setting as default, unset any existing default
    if (isDefault) {
      await req.prisma!.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const warehouse = await req.prisma!.warehouse.create({
      data: { name, address, isDefault: isDefault || false, tenantId: req.user!.tenantId },
    });
    res.status(201).json({ data: warehouse });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/warehouse/:id — update warehouse
router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, isDefault } = req.body as { name?: string; address?: string; isDefault?: boolean };

    const warehouse = await req.prisma!.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await req.prisma!.warehouse.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    }

    const updated = await req.prisma!.warehouse.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/warehouse/:id — delete warehouse (only if no stock in any bin)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const warehouse = await req.prisma!.warehouse.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            bins: {
              include: { stockLocations: { where: { quantity: { gt: 0 } } } },
            },
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    // Check for any stock
    const hasStock = warehouse.zones.some((z) => z.bins.some((b) => b.stockLocations.length > 0));
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot delete warehouse with stocked bins. Move or clear all inventory first.', code: 'HAS_STOCK' });
    }

    // Cascade: delete bins, zones, then warehouse
    const binIds = warehouse.zones.flatMap((z) => z.bins.map((b) => b.id));
    const zoneIds = warehouse.zones.map((z) => z.id);

    if (binIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: binIds } } });
    }
    if (zoneIds.length > 0) {
      await req.prisma!.zone.deleteMany({ where: { id: { in: zoneIds } } });
    }
    await req.prisma!.warehouse.delete({ where: { id } });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/:id/zones — create zone
router.post('/:id/zones', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, description } = req.body as { name: string; type: ZoneType; description?: string };

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

// PATCH /api/v1/warehouse/zones/:zoneId — update zone
router.patch('/zones/:zoneId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const { name, type, description } = req.body as { name?: string; type?: ZoneType; description?: string };

    const zone = await req.prisma!.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    const updated = await req.prisma!.zone.update({
      where: { id: zoneId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
      },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/warehouse/zones/:zoneId — delete zone + cascade bins (only if no stock)
router.delete('/zones/:zoneId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const zone = await req.prisma!.zone.findUnique({
      where: { id: zoneId },
      include: {
        bins: {
          include: { stockLocations: { where: { quantity: { gt: 0 } } } },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    const hasStock = zone.bins.some((b) => b.stockLocations.length > 0);
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot delete zone with stocked bins. Move or clear all inventory first.', code: 'HAS_STOCK' });
    }

    const binIds = zone.bins.map((b) => b.id);
    if (binIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: binIds } } });
    }
    await req.prisma!.zone.delete({ where: { id: zoneId } });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/zones/:zoneId/bins — create single bin
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

// POST /api/v1/warehouse/zones/:zoneId/bins/generate — bulk generate locations
// ShipHero-style hierarchy: Aisle → Rack → Shelf → Position
// Label format: {Aisle}-{Rack}-{Shelf}-{Position} e.g. A-01-03-02
router.post('/zones/:zoneId/bins/generate', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const {
      aisles, aisleNaming, racksPerAisle, shelvesPerRack, positionsPerShelf,
      // Legacy compat
      prefix, rows, positions,
    } = req.body as {
      aisles?: number;
      aisleNaming?: 'letters' | 'numbers';
      racksPerAisle?: number;
      shelvesPerRack?: number;
      positionsPerShelf?: number;
      prefix?: string;
      rows?: number;
      positions?: number;
    };

    const zone = await req.prisma!.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const binsData: { zoneId: number; label: string; row: string; shelf: string; position: string }[] = [];

    if (aisles && racksPerAisle && shelvesPerRack && positionsPerShelf) {
      // New WMS-style generation: Aisle-Rack-Shelf-Position
      const total = aisles * racksPerAisle * shelvesPerRack * positionsPerShelf;
      if (total > 2000) {
        return res.status(400).json({ error: true, message: `Cannot generate more than 2000 locations at once (requested ${total})`, code: 'VALIDATION_ERROR' });
      }

      const naming = aisleNaming || 'letters';

      for (let a = 1; a <= aisles; a++) {
        const aisleLabel = naming === 'letters'
          ? String.fromCharCode(64 + a) // A, B, C...
          : pad(a);                       // 01, 02, 03...

        for (let r = 1; r <= racksPerAisle; r++) {
          for (let s = 1; s <= shelvesPerRack; s++) {
            for (let p = 1; p <= positionsPerShelf; p++) {
              binsData.push({
                zoneId,
                label: `${aisleLabel}-${pad(r)}-${pad(s)}-${pad(p)}`,
                row: aisleLabel,
                shelf: pad(s),
                position: pad(p),
              });
            }
          }
        }
      }
    } else if (prefix && rows && positions) {
      // Legacy format: prefix-row-position
      if (rows < 1 || positions < 1) {
        return res.status(400).json({ error: true, message: 'rows and positions must be >= 1', code: 'VALIDATION_ERROR' });
      }
      if (rows * positions > 500) {
        return res.status(400).json({ error: true, message: 'Cannot generate more than 500 bins at once', code: 'VALIDATION_ERROR' });
      }
      for (let r = 1; r <= rows; r++) {
        for (let p = 1; p <= positions; p++) {
          binsData.push({
            zoneId,
            label: `${prefix}-${pad(r)}-${pad(p)}`,
            row: prefix,
            shelf: pad(r),
            position: pad(p),
          });
        }
      }
    } else {
      return res.status(400).json({ error: true, message: 'Provide either {aisles, racksPerAisle, shelvesPerRack, positionsPerShelf} or {prefix, rows, positions}', code: 'VALIDATION_ERROR' });
    }

    // Check for label conflicts
    const labels = binsData.map((b) => b.label);
    const existing = await req.prisma!.bin.findMany({ where: { label: { in: labels } }, select: { label: true } });
    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: `Labels already exist: ${existing.map((e) => e.label).join(', ')}`,
        code: 'DUPLICATE_LABELS',
      });
    }

    const created = await req.prisma!.bin.createMany({ data: binsData });
    const bins = await req.prisma!.bin.findMany({ where: { zoneId, label: { in: labels } } });

    res.status(201).json({ data: bins, meta: { count: created.count } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/warehouse/:id/floor-plan — save/update floor plan
router.put('/:id/floor-plan', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { width, height, unit, elements } = req.body as { width: number; height: number; unit?: string; elements: unknown[] };

    if (!width || !height || !isFinite(width) || !isFinite(height) || width < 3 || height < 3 || width > 100 || height > 100) {
      return res.status(400).json({ error: true, message: 'Width and height must be between 3 and 100', code: 'VALIDATION_ERROR' });
    }
    if (!Array.isArray(elements)) {
      return res.status(400).json({ error: true, message: 'Elements must be an array', code: 'VALIDATION_ERROR' });
    }

    const warehouse = await req.prisma!.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    const updated = await req.prisma!.warehouse.update({
      where: { id },
      data: { floorPlan: { width, height, unit: unit === 'ft' ? 'ft' : 'm', elements } },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/:id/floor-plan/auto-zone — auto-create zone + bins for floor plan element
router.post('/:id/floor-plan/auto-zone', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouseId = parseInt(req.params.id);
    const { elementType, label, prefix: customPrefix, shelvesCount, positionsPerShelf } = req.body as {
      elementType: string;
      label: string;
      prefix?: string;
      shelvesCount?: number;
      positionsPerShelf?: number;
    };

    const warehouse = await req.prisma!.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    // Map element type to zone type
    const typeMap: Record<string, string> = {
      shelf: 'STORAGE',
      pallet_rack: 'STORAGE',
      pallet_storage: 'STORAGE',
      packing_table: 'PACKING',
      receiving_area: 'RECEIVING',
      shipping_area: 'SHIPPING',
      dock_door: 'RECEIVING',
      staging_area: 'PICKING',
    };
    const zoneType = typeMap[elementType];
    if (!zoneType) {
      return res.status(400).json({ error: true, message: `Element type "${elementType}" cannot have a zone`, code: 'VALIDATION_ERROR' });
    }

    const zone = await req.prisma!.zone.create({
      data: { warehouseId, name: label, type: zoneType as any, description: `Auto-created from floor plan (${elementType})` },
    });

    let bins: any[] = [];
    const shelves = shelvesCount || 0;
    const positions = positionsPerShelf || 0;

    if (shelves > 0 && positions > 0) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const prefix = customPrefix || label.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'LOC';
      const binsData: { zoneId: number; label: string; row: string; shelf: string; position: string }[] = [];

      for (let s = 1; s <= shelves; s++) {
        for (let p = 1; p <= positions; p++) {
          binsData.push({
            zoneId: zone.id,
            label: `${prefix}-${pad(s)}-${pad(p)}`,
            row: prefix,
            shelf: pad(s),
            position: pad(p),
          });
        }
      }

      // Check for label conflicts
      const labels = binsData.map((b) => b.label);
      const existing = await req.prisma!.bin.findMany({ where: { label: { in: labels } }, select: { label: true } });
      if (existing.length > 0) {
        // Add zone id suffix to avoid conflicts
        for (const bd of binsData) {
          bd.label = `${bd.label}-Z${zone.id}`;
        }
      }

      await req.prisma!.bin.createMany({ data: binsData });
      bins = await req.prisma!.bin.findMany({ where: { zoneId: zone.id } });
    }

    res.status(201).json({ data: { zone, bins } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/zones/:zoneId/regenerate-bins — delete old bins + create new ones from config
router.post('/zones/:zoneId/regenerate-bins', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const { shelvesCount, positionsPerShelf, prefix: customPrefix } = req.body as {
      shelvesCount: number;
      positionsPerShelf: number;
      prefix?: string;
    };

    if (!shelvesCount || !positionsPerShelf || shelvesCount < 1 || positionsPerShelf < 1) {
      return res.status(400).json({ error: true, message: 'shelvesCount and positionsPerShelf must be >= 1', code: 'VALIDATION_ERROR' });
    }
    if (shelvesCount * positionsPerShelf > 500) {
      return res.status(400).json({ error: true, message: 'Cannot generate more than 500 locations at once', code: 'VALIDATION_ERROR' });
    }

    const zone = await req.prisma!.zone.findUnique({
      where: { id: zoneId },
      include: {
        bins: {
          include: { stockLocations: { where: { quantity: { gt: 0 } } } },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    // Block if any bin has stock
    const hasStock = zone.bins.some((b) => b.stockLocations.length > 0);
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot regenerate bins — some locations have stock. Move or clear inventory first.', code: 'HAS_STOCK' });
    }

    // Delete old bins
    const oldBinIds = zone.bins.map((b) => b.id);
    if (oldBinIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: oldBinIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: oldBinIds } } });
    }

    // Create new bins
    const pad = (n: number) => String(n).padStart(2, '0');
    const prefix = customPrefix || zone.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'LOC';
    const binsData: { zoneId: number; label: string; row: string; shelf: string; position: string }[] = [];

    for (let s = 1; s <= shelvesCount; s++) {
      for (let p = 1; p <= positionsPerShelf; p++) {
        binsData.push({
          zoneId,
          label: `${prefix}-${pad(s)}-${pad(p)}`,
          row: prefix,
          shelf: pad(s),
          position: pad(p),
        });
      }
    }

    // Check for label conflicts with OTHER zones
    const labels = binsData.map((b) => b.label);
    const existing = await req.prisma!.bin.findMany({ where: { label: { in: labels } }, select: { label: true } });
    if (existing.length > 0) {
      for (const bd of binsData) {
        bd.label = `${bd.label}-Z${zoneId}`;
      }
    }

    await req.prisma!.bin.createMany({ data: binsData });
    const bins = await req.prisma!.bin.findMany({ where: { zoneId } });

    res.status(201).json({ data: { zone, bins }, meta: { count: bins.length } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/warehouse/bins/:binId — update bin
router.patch('/bins/:binId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const binId = parseInt(req.params.binId);
    const { label, row, shelf, position, capacity, isActive } = req.body as {
      label?: string;
      row?: string;
      shelf?: string;
      position?: string;
      capacity?: number | null;
      isActive?: boolean;
    };

    const bin = await req.prisma!.bin.findUnique({ where: { id: binId } });
    if (!bin) {
      return res.status(404).json({ error: true, message: 'Bin not found', code: 'NOT_FOUND' });
    }

    const updated = await req.prisma!.bin.update({
      where: { id: binId },
      data: {
        ...(label !== undefined && { label }),
        ...(row !== undefined && { row }),
        ...(shelf !== undefined && { shelf }),
        ...(position !== undefined && { position }),
        ...(capacity !== undefined && { capacity }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/warehouse/bins/:binId — delete bin (only if no stock)
router.delete('/bins/:binId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const binId = parseInt(req.params.binId);
    const bin = await req.prisma!.bin.findUnique({
      where: { id: binId },
      include: { stockLocations: { where: { quantity: { gt: 0 } } } },
    });

    if (!bin) {
      return res.status(404).json({ error: true, message: 'Bin not found', code: 'NOT_FOUND' });
    }

    if (bin.stockLocations.length > 0) {
      return res.status(409).json({ error: true, message: 'Cannot delete bin with stock. Move or clear inventory first.', code: 'HAS_STOCK' });
    }

    await req.prisma!.stockLocation.deleteMany({ where: { binId } });
    await req.prisma!.bin.delete({ where: { id: binId } });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
