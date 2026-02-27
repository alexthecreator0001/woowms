import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handleOrderWebhook, verifyWebhook } from './woocommerce/webhooks.js';
import { syncOrders, syncProducts } from './woocommerce/sync.js';

import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import warehouseRoutes from './routes/warehouse.js';
import pickingRoutes from './routes/picking.js';
import shippingRoutes from './routes/shipping.js';
import receivingRoutes from './routes/receiving.js';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.isDev ? 'dev' : 'combined'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/picking', pickingRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/receiving', receivingRoutes);

// WooCommerce webhooks
if (config.woocommerce.webhookSecret) {
  app.post(
    '/api/webhooks/woocommerce',
    verifyWebhook(config.woocommerce.webhookSecret),
    handleOrderWebhook
  );
}

// Error handler
app.use(errorHandler);

// Cron: sync with WooCommerce every 5 minutes
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
  console.log(`[WooWMS] Backend running on port ${config.port}`);
  console.log(`[WooWMS] Environment: ${config.nodeEnv}`);
});
