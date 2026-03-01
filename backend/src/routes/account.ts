import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../lib/prisma.js';
import { authorize } from '../middleware/auth.js';
import type { User } from '@prisma/client';

const router = Router();

function generateToken(user: Pick<User, 'id' | 'email' | 'role' | 'name' | 'emailVerified' | 'onboardingCompleted'>, tenantId: number): string {
  return jwt.sign(
    {
      id: user.id,
      tenantId,
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// PATCH /api/v1/account/profile — update name
router.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: true, message: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim() },
    });

    const token = generateToken(updated, req.user!.tenantId);
    res.json({ data: { name: updated.name, token } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/account/email — update email (requires password verification)
router.patch('/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Incorrect password', code: 'INVALID_PASSWORD' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: true, message: 'Email already in use', code: 'EMAIL_EXISTS' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });

    const token = generateToken(updated, req.user!.tenantId);
    res.json({ data: { email: updated.email, token } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/account/password — change password
router.patch('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: true, message: 'Current and new password are required', code: 'VALIDATION_ERROR' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: true, message: 'New password must be at least 8 characters', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    res.json({ data: { message: 'Password updated successfully' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/account/preferences — get user preferences
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });
    res.json({ data: user?.preferences || {} });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/account/preferences — update user preferences (merge)
router.patch('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: true, message: 'Request body must be an object', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });

    const existing = (user?.preferences as Record<string, unknown>) || {};
    const merged = { ...existing, ...updates };

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { preferences: merged },
      select: { preferences: true },
    });

    res.json({ data: updated.preferences });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/account/tenant-settings — get tenant settings (admin only)
router.get('/tenant-settings', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user!.tenantId },
      select: { settings: true },
    });
    res.json({ data: tenant?.settings || {} });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/account/tenant-settings — update tenant settings (admin only, shallow merge)
router.patch('/tenant-settings', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: true, message: 'Request body must be an object', code: 'VALIDATION_ERROR' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user!.tenantId },
      select: { settings: true },
    });

    const existing = (tenant?.settings as Record<string, unknown>) || {};
    const merged = { ...existing, ...updates };

    const updated = await prisma.tenant.update({
      where: { id: req.user!.tenantId },
      data: { settings: merged },
      select: { settings: true },
    });

    res.json({ data: updated.settings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/account/branding — update company/tenant name (admin only)
router.patch('/branding', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName } = req.body;
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({ error: true, message: 'Company name is required', code: 'VALIDATION_ERROR' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.user!.tenantId },
      data: { name: companyName.trim() },
    });

    res.json({ data: { companyName: tenant.name } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/account — delete entire account (admin only, cascade)
router.delete('/', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, confirmText } = req.body;
    if (!password || confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ error: true, message: 'Password and confirmation text "DELETE MY ACCOUNT" are required', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Incorrect password', code: 'INVALID_PASSWORD' });
    }

    const tenantId = req.user!.tenantId;

    // Cascade delete all tenant data in a transaction
    await prisma.$transaction(async (tx) => {
      // Get store IDs for this tenant
      const stores = await tx.store.findMany({ where: { tenantId }, select: { id: true } });
      const storeIds = stores.map((s) => s.id);

      if (storeIds.length > 0) {
        // 1. PickListItems → PickLists (via orders)
        const orders = await tx.order.findMany({ where: { storeId: { in: storeIds } }, select: { id: true } });
        const orderIds = orders.map((o) => o.id);

        if (orderIds.length > 0) {
          const pickLists = await tx.pickList.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
          const pickListIds = pickLists.map((p) => p.id);
          if (pickListIds.length > 0) {
            await tx.pickListItem.deleteMany({ where: { pickListId: { in: pickListIds } } });
          }
          await tx.pickList.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.shipment.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        }
        await tx.order.deleteMany({ where: { storeId: { in: storeIds } } });

        // 2. Products (via stores)
        const products = await tx.product.findMany({ where: { storeId: { in: storeIds } }, select: { id: true } });
        const productIds = products.map((p) => p.id);
        if (productIds.length > 0) {
          await tx.stockMovement.deleteMany({ where: { productId: { in: productIds } } });
          await tx.stockLocation.deleteMany({ where: { productId: { in: productIds } } });
        }
        await tx.product.deleteMany({ where: { storeId: { in: storeIds } } });

        // 3. Stores
        await tx.store.deleteMany({ where: { tenantId } });
      }

      // 4. Warehouses → Zones → Bins
      const warehouses = await tx.warehouse.findMany({ where: { tenantId }, select: { id: true } });
      const warehouseIds = warehouses.map((w) => w.id);
      if (warehouseIds.length > 0) {
        const zones = await tx.zone.findMany({ where: { warehouseId: { in: warehouseIds } }, select: { id: true } });
        const zoneIds = zones.map((z) => z.id);
        if (zoneIds.length > 0) {
          // Delete stock locations tied to bins in these zones
          const bins = await tx.bin.findMany({ where: { zoneId: { in: zoneIds } }, select: { id: true } });
          const binIds = bins.map((b) => b.id);
          if (binIds.length > 0) {
            await tx.stockLocation.deleteMany({ where: { binId: { in: binIds } } });
          }
          await tx.bin.deleteMany({ where: { zoneId: { in: zoneIds } } });
        }
        await tx.zone.deleteMany({ where: { warehouseId: { in: warehouseIds } } });
        await tx.warehouse.deleteMany({ where: { tenantId } });
      }

      // 5. Purchase Orders
      const purchaseOrders = await tx.purchaseOrder.findMany({ where: { tenantId }, select: { id: true } });
      const poIds = purchaseOrders.map((po) => po.id);
      if (poIds.length > 0) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: poIds } } });
        await tx.purchaseOrder.deleteMany({ where: { tenantId } });
      }

      // 6. Users + Tenant
      await tx.user.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    res.json({ data: { message: 'Account deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
