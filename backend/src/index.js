import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';

import config from './config/index.js';
import prisma from './lib/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { injectTenant } from './middleware/tenant.js';
import { handleStoreWebhook } from './woocommerce/webhooks.js';
import { syncOrders, syncProducts } from './woocommerce/sync.js';

import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import warehouseRoutes from './routes/warehouse.js';
import pickingRoutes from './routes/picking.js';
import shippingRoutes from './routes/shipping.js';
import receivingRoutes from './routes/receiving.js';

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.isDev ? 'dev' : 'combined'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no tenant middleware — login/register happen before tenant context)
app.use('/api/v1/auth', authRoutes);

// WooCommerce webhooks — per-store, no JWT (uses HMAC verification)
app.post('/api/webhooks/woocommerce/:storeId', handleStoreWebhook);

// All other API routes require authentication + tenant context
app.use('/api/v1', authenticate, injectTenant);

app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/picking', pickingRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/receiving', receivingRoutes);

// Error handler
app.use(errorHandler);

// Cron: sync with WooCommerce every 5 minutes (all active stores across all tenants)
cron.schedule('*/5 * * * *', async () => {
  try {
    const stores = await prisma.store.findMany({ where: { isActive: true } });
    for (const store of stores) {
      await syncOrders(store);
      await syncProducts(store);
    }
  } catch (err) {
    console.error('[CRON] Sync failed:', err.message);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`[PickNPack] Backend running on port ${config.port}`);
  console.log(`[PickNPack] Environment: ${config.nodeEnv}`);
});
