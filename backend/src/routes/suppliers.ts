import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/v1/suppliers — list suppliers with search, pagination, isActive filter
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive as string | undefined;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      req.prisma!.supplier.findMany({
        where,
        include: {
          _count: { select: { supplierProducts: true, purchaseOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      req.prisma!.supplier.count({ where }),
    ]);

    res.json({
      data: suppliers,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/suppliers/:id — get supplier detail with products and recent POs
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);
    const supplier = await req.prisma!.supplier.findFirst({
      where: { id: supplierId },
      include: {
        supplierProducts: { include: { product: true } },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: true, message: 'Supplier not found', code: 'NOT_FOUND' });
    }

    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/suppliers — create supplier (ADMIN/MANAGER)
router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, notes } = req.body as {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
    };

    if (!name) {
      return res.status(400).json({ error: true, message: 'Supplier name is required', code: 'VALIDATION_ERROR' });
    }

    const supplier = await req.prisma!.supplier.create({
      data: {
        tenantId: req.tenantId!,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
      include: {
        _count: { select: { supplierProducts: true, purchaseOrders: true } },
      },
    });

    res.status(201).json({ data: supplier });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/suppliers/:id — update supplier (ADMIN/MANAGER)
router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);

    const existing = await req.prisma!.supplier.findFirst({
      where: { id: supplierId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier not found', code: 'NOT_FOUND' });
    }

    const { name, email, phone, address, notes, isActive } = req.body as {
      name?: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
      isActive?: boolean;
    };

    const supplier = await req.prisma!.supplier.update({
      where: { id: supplierId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: { select: { supplierProducts: true, purchaseOrders: true } },
      },
    });

    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/suppliers/:id — soft-delete supplier (ADMIN/MANAGER)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);

    const existing = await req.prisma!.supplier.findFirst({
      where: { id: supplierId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier not found', code: 'NOT_FOUND' });
    }

    await req.prisma!.supplier.update({
      where: { id: supplierId },
      data: { isActive: false },
    });

    res.json({ data: { message: 'Supplier deactivated' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/suppliers/:id/products — get supplier's product mappings
router.get('/:id/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);

    const existing = await req.prisma!.supplier.findFirst({
      where: { id: supplierId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier not found', code: 'NOT_FOUND' });
    }

    const mappings = await req.prisma!.supplierProduct.findMany({
      where: { supplierId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: mappings });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/suppliers/:id/products — add product mapping (ADMIN/MANAGER)
router.post('/:id/products', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);

    const existing = await req.prisma!.supplier.findFirst({
      where: { id: supplierId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier not found', code: 'NOT_FOUND' });
    }

    const { productId, supplierSku, supplierPrice, leadTimeDays } = req.body as {
      productId: number;
      supplierSku: string;
      supplierPrice?: number;
      leadTimeDays?: number;
    };

    if (!productId || !supplierSku) {
      return res.status(400).json({ error: true, message: 'productId and supplierSku are required', code: 'VALIDATION_ERROR' });
    }

    const mapping = await req.prisma!.supplierProduct.create({
      data: {
        supplierId,
        productId,
        supplierSku,
        supplierPrice: supplierPrice ?? null,
        leadTimeDays: leadTimeDays ?? null,
      },
      include: { product: true },
    });

    res.status(201).json({ data: mapping });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: true, message: 'This product is already mapped to this supplier', code: 'DUPLICATE' });
    }
    next(err);
  }
});

// PATCH /api/v1/suppliers/:id/products/:productId — update mapping (ADMIN/MANAGER)
router.patch('/:id/products/:productId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);

    const existing = await req.prisma!.supplierProduct.findFirst({
      where: { supplierId, productId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier product mapping not found', code: 'NOT_FOUND' });
    }

    const { supplierSku, supplierPrice, leadTimeDays } = req.body as {
      supplierSku?: string;
      supplierPrice?: number | null;
      leadTimeDays?: number | null;
    };

    const mapping = await req.prisma!.supplierProduct.update({
      where: { id: existing.id },
      data: {
        ...(supplierSku !== undefined && { supplierSku }),
        ...(supplierPrice !== undefined && { supplierPrice }),
        ...(leadTimeDays !== undefined && { leadTimeDays }),
      },
      include: { product: true },
    });

    res.json({ data: mapping });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/suppliers/:id/products/:productId — remove mapping (ADMIN/MANAGER)
router.delete('/:id/products/:productId', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplierId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);

    const existing = await req.prisma!.supplierProduct.findFirst({
      where: { supplierId, productId },
    });

    if (!existing) {
      return res.status(404).json({ error: true, message: 'Supplier product mapping not found', code: 'NOT_FOUND' });
    }

    await req.prisma!.supplierProduct.delete({
      where: { id: existing.id },
    });

    res.json({ data: { message: 'Supplier product mapping removed' } });
  } catch (err) {
    next(err);
  }
});

export default router;
