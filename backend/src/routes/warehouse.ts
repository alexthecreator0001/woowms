import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import type { ZoneType, BinSize, RackType } from '@prisma/client';

const router = Router();

// Default capacity by bin size (in capacity units, 1 unit ≈ 1 liter)
const BIN_SIZE_DEFAULTS: Record<string, number> = {
  SMALL: 25,       // ~25 liters, small tote/bin
  MEDIUM: 100,     // ~100 liters, standard shelf section
  LARGE: 500,      // ~500 liters, large rack section
  XLARGE: 4000,    // ~4,000 liters, pallet rack bay
};

// Calculate how many capacity units a product occupies based on volume
// 1 capacity unit ≈ 1 liter (1,000 cm³)
export function getCapacityUnits(product: { length?: number | null; width?: number | null; height?: number | null; sizeCategory?: string | null }): number {
  if (product.length && product.width && product.height) {
    const volumeCm3 = Number(product.length) * Number(product.width) * Number(product.height);
    return Math.max(1, Math.round(volumeCm3 / 1000));
  }
  // Fallback to size category multipliers
  const multipliers: Record<string, number> = { SMALL: 1, MEDIUM: 3, LARGE: 15, XLARGE: 50, OVERSIZED: 200 };
  return multipliers[product.sizeCategory || ''] || 1;
}

// Shared include chain: zones → racks → bins → stockLocations
const warehouseInclude = {
  zones: {
    include: {
      racks: {
        include: {
          bins: {
            include: {
              stockLocations: {
                select: {
                  quantity: true,
                  product: {
                    select: { id: true, name: true, sku: true, imageUrl: true, sizeCategory: true, length: true, width: true, height: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// GET /api/v1/warehouse — list all warehouses with zones, racks, bins, and stock counts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await req.prisma!.warehouse.findMany({ include: warehouseInclude });

    // Add _stockCount (item count) and _capacityUsed (volume-weighted) to each bin
    const data = warehouses.map((wh) => ({
      ...wh,
      zones: wh.zones.map((zone) => ({
        ...zone,
        racks: zone.racks.map((rack) => ({
          ...rack,
          bins: rack.bins.map((bin) => ({
            ...bin,
            _stockCount: bin.stockLocations.reduce((sum, sl) => sum + sl.quantity, 0),
            _capacityUsed: bin.stockLocations.reduce((sum, sl) => {
              const units = sl.product ? getCapacityUnits(sl.product) : 1;
              return sum + sl.quantity * units;
            }, 0),
          })),
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
            racks: {
              include: {
                bins: {
                  include: { stockLocations: { where: { quantity: { gt: 0 } } } },
                },
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    // Check for any stock
    const hasStock = warehouse.zones.some((z) =>
      z.racks.some((r) => r.bins.some((b) => b.stockLocations.length > 0)),
    );
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot delete warehouse with stocked bins. Move or clear all inventory first.', code: 'HAS_STOCK' });
    }

    // Cascade: delete bins, racks, zones, then warehouse
    const binIds = warehouse.zones.flatMap((z) => z.racks.flatMap((r) => r.bins.map((b) => b.id)));
    const rackIds = warehouse.zones.flatMap((z) => z.racks.map((r) => r.id));
    const zoneIds = warehouse.zones.map((z) => z.id);

    if (binIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: binIds } } });
    }
    if (rackIds.length > 0) {
      await req.prisma!.rack.deleteMany({ where: { id: { in: rackIds } } });
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

// DELETE /api/v1/warehouse/zones/:zoneId — delete zone + cascade racks/bins (only if no stock)
router.delete('/zones/:zoneId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const zone = await req.prisma!.zone.findUnique({
      where: { id: zoneId },
      include: {
        racks: {
          include: {
            bins: {
              include: { stockLocations: { where: { quantity: { gt: 0 } } } },
            },
          },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    const hasStock = zone.racks.some((r) => r.bins.some((b) => b.stockLocations.length > 0));
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot delete zone with stocked bins. Move or clear all inventory first.', code: 'HAS_STOCK' });
    }

    const binIds = zone.racks.flatMap((r) => r.bins.map((b) => b.id));
    const rackIds = zone.racks.map((r) => r.id);
    if (binIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: binIds } } });
    }
    if (rackIds.length > 0) {
      await req.prisma!.rack.deleteMany({ where: { id: { in: rackIds } } });
    }
    await req.prisma!.zone.delete({ where: { id: zoneId } });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// ─── Rack CRUD ──────────────────────────────────────────

// POST /api/v1/warehouse/:warehouseId/zones/:zoneId/racks — create rack
router.post('/:warehouseId/zones/:zoneId/racks', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    const { name, type, prefix, description } = req.body as {
      name: string;
      type?: RackType;
      prefix?: string;
      description?: string;
    };

    const zone = await req.prisma!.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return res.status(404).json({ error: true, message: 'Zone not found', code: 'NOT_FOUND' });
    }

    const rack = await req.prisma!.rack.create({
      data: {
        zoneId,
        name,
        type: type || 'SHELVING',
        prefix: prefix || null,
        description: description || null,
      },
      include: { bins: true },
    });
    res.status(201).json({ data: rack });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/warehouse/racks/:rackId — update rack
router.patch('/racks/:rackId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rackId = parseInt(req.params.rackId);
    const { name, type, prefix, description } = req.body as {
      name?: string;
      type?: RackType;
      prefix?: string;
      description?: string;
    };

    const rack = await req.prisma!.rack.findUnique({ where: { id: rackId } });
    if (!rack) {
      return res.status(404).json({ error: true, message: 'Rack not found', code: 'NOT_FOUND' });
    }

    const updated = await req.prisma!.rack.update({
      where: { id: rackId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(prefix !== undefined && { prefix }),
        ...(description !== undefined && { description }),
      },
      include: { bins: true },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/warehouse/racks/:rackId — delete rack (only if all bins empty)
router.delete('/racks/:rackId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rackId = parseInt(req.params.rackId);
    const rack = await req.prisma!.rack.findUnique({
      where: { id: rackId },
      include: {
        bins: {
          include: { stockLocations: { where: { quantity: { gt: 0 } } } },
        },
      },
    });

    if (!rack) {
      return res.status(404).json({ error: true, message: 'Rack not found', code: 'NOT_FOUND' });
    }

    const hasStock = rack.bins.some((b) => b.stockLocations.length > 0);
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot delete rack with stocked bins. Move or clear all inventory first.', code: 'HAS_STOCK' });
    }

    const binIds = rack.bins.map((b) => b.id);
    if (binIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: binIds } } });
    }
    await req.prisma!.rack.delete({ where: { id: rackId } });

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// ─── Bin Creation (now under racks) ─────────────────────

// POST /api/v1/warehouse/racks/:rackId/bins — create single bin
router.post('/racks/:rackId/bins', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rackId = parseInt(req.params.rackId);
    const { label, row, shelf, position, capacity, binSize } = req.body as {
      label: string;
      row?: string;
      shelf?: string;
      position?: string;
      capacity?: number;
      binSize?: BinSize;
    };

    const rack = await req.prisma!.rack.findUnique({ where: { id: rackId } });
    if (!rack) {
      return res.status(404).json({ error: true, message: 'Rack not found', code: 'NOT_FOUND' });
    }

    const effectiveCapacity = capacity ?? (binSize ? BIN_SIZE_DEFAULTS[binSize] : BIN_SIZE_DEFAULTS.MEDIUM);
    const bin = await req.prisma!.bin.create({
      data: {
        rackId,
        label, row, shelf, position,
        capacity: effectiveCapacity,
        binSize: binSize || 'MEDIUM',
      },
    });
    res.status(201).json({ data: bin });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/racks/:rackId/bins/generate — bulk generate locations
// ShipHero-style hierarchy: Aisle → Rack → Shelf → Position
// Label format: {Aisle}-{Rack}-{Shelf}-{Position} e.g. A-01-03-02
router.post('/racks/:rackId/bins/generate', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rackId = parseInt(req.params.rackId);
    const {
      aisles, aisleNaming, racksPerAisle, shelvesPerRack, positionsPerShelf,
      binSize,
      // Legacy compat
      prefix, rows, positions,
    } = req.body as {
      aisles?: number;
      aisleNaming?: 'letters' | 'numbers';
      racksPerAisle?: number;
      shelvesPerRack?: number;
      positionsPerShelf?: number;
      binSize?: BinSize;
      prefix?: string;
      rows?: number;
      positions?: number;
    };

    const rack = await req.prisma!.rack.findUnique({ where: { id: rackId } });
    if (!rack) {
      return res.status(404).json({ error: true, message: 'Rack not found', code: 'NOT_FOUND' });
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const effectiveBinSize = binSize || 'MEDIUM';
    const effectiveCapacity = BIN_SIZE_DEFAULTS[effectiveBinSize] || 50;
    const binsData: { rackId: number; label: string; row: string; shelf: string; position: string; binSize: BinSize; capacity: number }[] = [];

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
                rackId,
                label: `${aisleLabel}-${pad(r)}-${pad(s)}-${pad(p)}`,
                row: aisleLabel,
                shelf: pad(s),
                position: pad(p),
                binSize: effectiveBinSize as BinSize,
                capacity: effectiveCapacity,
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
            rackId,
            label: `${prefix}-${pad(r)}-${pad(p)}`,
            row: prefix,
            shelf: pad(r),
            position: pad(p),
            binSize: effectiveBinSize as BinSize,
            capacity: effectiveCapacity,
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
    const bins = await req.prisma!.bin.findMany({ where: { rackId, label: { in: labels } } });

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

// POST /api/v1/warehouse/:id/floor-plan/auto-zone — auto-create zone + rack + bins for floor plan element
router.post('/:id/floor-plan/auto-zone', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouseId = parseInt(req.params.id);
    const { elementType, label, prefix: customPrefix, shelvesCount, positionsPerShelf, binSize: reqBinSize } = req.body as {
      elementType: string;
      label: string;
      prefix?: string;
      shelvesCount?: number;
      positionsPerShelf?: number;
      binSize?: BinSize;
    };

    const warehouse = await req.prisma!.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) {
      return res.status(404).json({ error: true, message: 'Warehouse not found', code: 'NOT_FOUND' });
    }

    // Only storage element types can create zones with locations
    const STORAGE_TYPES = ['shelf', 'pallet_rack', 'pallet_storage'];
    if (!STORAGE_TYPES.includes(elementType)) {
      return res.status(400).json({ error: true, message: `Element type "${elementType}" cannot have a zone — only storage elements (shelf, pallet rack, pallet storage) create zones`, code: 'VALIDATION_ERROR' });
    }

    // Map element type to zone type
    const typeMap: Record<string, string> = {
      shelf: 'STORAGE',
      pallet_rack: 'STORAGE',
      pallet_storage: 'STORAGE',
    };
    const zoneType = typeMap[elementType]!;

    // Derive rack type from element type
    const rackTypeMap: Record<string, RackType> = {
      shelf: 'SHELVING',
      pallet_rack: 'PALLET',
      pallet_storage: 'PALLET',
    };
    const rackType = rackTypeMap[elementType] || 'SHELVING';

    const zone = await req.prisma!.zone.create({
      data: { warehouseId, name: label, type: zoneType as any, description: `Auto-created from floor plan (${elementType})` },
    });

    // Create a rack inside the zone
    const rack = await req.prisma!.rack.create({
      data: {
        zoneId: zone.id,
        name: label,
        type: rackType,
        prefix: customPrefix || null,
      },
    });

    let bins: any[] = [];
    const shelves = shelvesCount || 0;
    const positions = positionsPerShelf || 0;
    const effectiveBinSize = reqBinSize || 'MEDIUM';
    const effectiveCapacity = BIN_SIZE_DEFAULTS[effectiveBinSize] || 50;

    if (shelves > 0 && positions > 0) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const prefix = customPrefix || label.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'LOC';
      const binsData: { rackId: number; label: string; row: string; shelf: string; position: string; binSize: BinSize; capacity: number }[] = [];

      for (let s = 1; s <= shelves; s++) {
        for (let p = 1; p <= positions; p++) {
          binsData.push({
            rackId: rack.id,
            label: `${prefix}-${pad(s)}-${pad(p)}`,
            row: prefix,
            shelf: pad(s),
            position: pad(p),
            binSize: effectiveBinSize as BinSize,
            capacity: effectiveCapacity,
          });
        }
      }

      // Check for label conflicts
      const labels = binsData.map((b) => b.label);
      const existing = await req.prisma!.bin.findMany({ where: { label: { in: labels } }, select: { label: true } });
      if (existing.length > 0) {
        // Add rack id suffix to avoid conflicts
        for (const bd of binsData) {
          bd.label = `${bd.label}-R${rack.id}`;
        }
      }

      await req.prisma!.bin.createMany({ data: binsData });
      bins = await req.prisma!.bin.findMany({ where: { rackId: rack.id } });
    }

    res.status(201).json({ data: { zone, rack, bins } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/warehouse/racks/:rackId/regenerate-bins — delete old bins + create new ones from config
router.post('/racks/:rackId/regenerate-bins', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rackId = parseInt(req.params.rackId);
    const { shelvesCount, positionsPerShelf, prefix: customPrefix, binSize: reqBinSize } = req.body as {
      shelvesCount: number;
      positionsPerShelf: number;
      prefix?: string;
      binSize?: BinSize;
    };

    if (!shelvesCount || !positionsPerShelf || shelvesCount < 1 || positionsPerShelf < 1) {
      return res.status(400).json({ error: true, message: 'shelvesCount and positionsPerShelf must be >= 1', code: 'VALIDATION_ERROR' });
    }
    if (shelvesCount * positionsPerShelf > 500) {
      return res.status(400).json({ error: true, message: 'Cannot generate more than 500 locations at once', code: 'VALIDATION_ERROR' });
    }

    const rack = await req.prisma!.rack.findUnique({
      where: { id: rackId },
      include: {
        bins: {
          include: { stockLocations: { where: { quantity: { gt: 0 } } } },
        },
      },
    });

    if (!rack) {
      return res.status(404).json({ error: true, message: 'Rack not found', code: 'NOT_FOUND' });
    }

    // Block if any bin has stock
    const hasStock = rack.bins.some((b) => b.stockLocations.length > 0);
    if (hasStock) {
      return res.status(409).json({ error: true, message: 'Cannot regenerate bins — some locations have stock. Move or clear inventory first.', code: 'HAS_STOCK' });
    }

    // Delete old bins
    const oldBinIds = rack.bins.map((b) => b.id);
    if (oldBinIds.length > 0) {
      await req.prisma!.stockLocation.deleteMany({ where: { binId: { in: oldBinIds } } });
      await req.prisma!.bin.deleteMany({ where: { id: { in: oldBinIds } } });
    }

    // Create new bins
    const pad = (n: number) => String(n).padStart(2, '0');
    const prefix = customPrefix || rack.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'LOC';
    const effectiveBinSize = reqBinSize || 'MEDIUM';
    const effectiveCapacity = BIN_SIZE_DEFAULTS[effectiveBinSize] || 50;
    const binsData: { rackId: number; label: string; row: string; shelf: string; position: string; binSize: BinSize; capacity: number }[] = [];

    for (let s = 1; s <= shelvesCount; s++) {
      for (let p = 1; p <= positionsPerShelf; p++) {
        binsData.push({
          rackId,
          label: `${prefix}-${pad(s)}-${pad(p)}`,
          row: prefix,
          shelf: pad(s),
          position: pad(p),
          binSize: effectiveBinSize as BinSize,
          capacity: effectiveCapacity,
        });
      }
    }

    // Check for label conflicts with OTHER racks
    const labels = binsData.map((b) => b.label);
    const existing = await req.prisma!.bin.findMany({ where: { label: { in: labels } }, select: { label: true } });
    if (existing.length > 0) {
      for (const bd of binsData) {
        bd.label = `${bd.label}-R${rackId}`;
      }
    }

    await req.prisma!.bin.createMany({ data: binsData });
    const bins = await req.prisma!.bin.findMany({ where: { rackId } });

    res.status(201).json({ data: { rack, bins }, meta: { count: bins.length } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/warehouse/bins/:binId — update bin
router.patch('/bins/:binId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const binId = parseInt(req.params.binId);
    const { label, row, shelf, position, capacity, isActive, binSize, pickable, sellable, maxWeight } = req.body as {
      label?: string;
      row?: string;
      shelf?: string;
      position?: string;
      capacity?: number | null;
      isActive?: boolean;
      binSize?: BinSize;
      pickable?: boolean;
      sellable?: boolean;
      maxWeight?: number | null;
    };

    const bin = await req.prisma!.bin.findUnique({ where: { id: binId } });
    if (!bin) {
      return res.status(404).json({ error: true, message: 'Bin not found', code: 'NOT_FOUND' });
    }

    // If binSize changes and no explicit capacity, auto-set capacity from defaults
    const effectiveCapacity = capacity !== undefined
      ? capacity
      : (binSize && binSize !== bin.binSize ? BIN_SIZE_DEFAULTS[binSize] : undefined);

    const updated = await req.prisma!.bin.update({
      where: { id: binId },
      data: {
        ...(label !== undefined && { label }),
        ...(row !== undefined && { row }),
        ...(shelf !== undefined && { shelf }),
        ...(position !== undefined && { position }),
        ...(effectiveCapacity !== undefined && { capacity: effectiveCapacity }),
        ...(isActive !== undefined && { isActive }),
        ...(binSize !== undefined && { binSize }),
        ...(pickable !== undefined && { pickable }),
        ...(sellable !== undefined && { sellable }),
        ...(maxWeight !== undefined && { maxWeight }),
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
