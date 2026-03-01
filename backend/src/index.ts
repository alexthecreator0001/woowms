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
import accountRoutes from './routes/account.js';
import teamRoutes from './routes/team.js';
import storeRoutes from './routes/stores.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import warehouseRoutes from './routes/warehouse.js';
import pickingRoutes from './routes/picking.js';
import shippingRoutes from './routes/shipping.js';
import receivingRoutes from './routes/receiving.js';
import supplierRoutes from './routes/suppliers.js';
import imageRoutes from './routes/images.js';
import pluginRoutes from './routes/plugins.js';

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.isDev ? 'dev' : 'combined'));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no tenant middleware — login/register happen before tenant context)
app.use('/api/v1/auth', authRoutes);

// WooCommerce webhooks — per-store, no JWT (uses HMAC verification)
app.post('/api/webhooks/woocommerce/:storeId', handleStoreWebhook);

// Image proxy — public (no auth needed, used by <img> tags)
app.use('/api/v1/images', imageRoutes);

// Zapier webhook — uses API key auth, not JWT (must be before authenticate middleware)
app.post('/api/v1/plugins/zapier/webhook', pluginRoutes);
app.get('/api/v1/plugins/zapier/webhook/test', pluginRoutes);

// All other API routes require authentication + tenant context
app.use('/api/v1', authenticate, injectTenant);

app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/picking', pickingRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/receiving', receivingRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/plugins', pluginRoutes);

// Error handler
app.use(errorHandler);

// Cron: check every 1 minute, sync stores whose interval has elapsed
cron.schedule('* * * * *', async () => {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true, autoSync: true },
    });

    const now = Date.now();
    for (const store of stores) {
      const minutesSinceLastSync = store.lastSyncAt
        ? (now - store.lastSyncAt.getTime()) / 60000
        : Infinity;

      if (minutesSinceLastSync < store.syncIntervalMin) continue;

      try {
        await syncOrders(store);
        await syncProducts(store);
        await prisma.store.update({
          where: { id: store.id },
          data: { lastSyncAt: new Date() },
        });
      } catch (storeErr) {
        console.error(`[CRON] Sync failed for store ${store.name}:`, (storeErr as Error).message);
      }
    }
  } catch (err) {
    console.error('[CRON] Sync failed:', (err as Error).message);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`[PickNPack] Backend running on port ${config.port}`);
  console.log(`[PickNPack] Environment: ${config.nodeEnv}`);
});
