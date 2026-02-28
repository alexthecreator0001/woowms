import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { syncOrders, syncProducts } from '../woocommerce/sync.js';
import { encrypt } from '../lib/crypto.js';

const router = Router();

// GET /api/v1/stores — list tenant's stores
router.get('/', async (req, res, next) => {
  try {
    const stores = await req.prisma.store.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: stores });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stores — connect a new WooCommerce store
router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, url, consumerKey, consumerSecret, webhookSecret } = req.body;

    if (!name || !url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: true, message: 'name, url, consumerKey, and consumerSecret are required', code: 'VALIDATION_ERROR' });
    }

    const store = await req.prisma.store.create({
      data: {
        name,
        url,
        consumerKey: encrypt(consumerKey),
        consumerSecret: encrypt(consumerSecret),
        webhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
      },
    });

    res.status(201).json({
      data: {
        id: store.id,
        name: store.name,
        url: store.url,
        isActive: store.isActive,
        createdAt: store.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/stores/:id — update store settings
router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, url, consumerKey, consumerSecret, webhookSecret, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (consumerKey !== undefined) data.consumerKey = encrypt(consumerKey);
    if (consumerSecret !== undefined) data.consumerSecret = encrypt(consumerSecret);
    if (webhookSecret !== undefined) data.webhookSecret = webhookSecret ? encrypt(webhookSecret) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const store = await req.prisma.store.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    res.json({
      data: {
        id: store.id,
        name: store.name,
        url: store.url,
        isActive: store.isActive,
        lastSyncAt: store.lastSyncAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/stores/:id — disconnect a store
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await req.prisma.store.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ data: { message: 'Store disconnected' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stores/:id/sync — trigger manual sync
router.post('/:id/sync', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const store = await req.prisma.store.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!store) {
      return res.status(404).json({ error: true, message: 'Store not found', code: 'NOT_FOUND' });
    }

    await syncOrders(store);
    await syncProducts(store);

    await req.prisma.store.update({
      where: { id: store.id },
      data: { lastSyncAt: new Date() },
    });

    res.json({ data: { message: 'Sync complete' } });
  } catch (err) {
    next(err);
  }
});

export default router;
