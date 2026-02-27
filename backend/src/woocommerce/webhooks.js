import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { syncOrders } from './sync.js';

const prisma = new PrismaClient();

export function verifyWebhook(secret) {
  return (req, res, next) => {
    const signature = req.headers['x-wc-webhook-signature'];
    if (!signature) {
      return res.status(401).json({ error: true, message: 'No webhook signature' });
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('base64');

    if (hash !== signature) {
      return res.status(401).json({ error: true, message: 'Invalid webhook signature' });
    }

    next();
  };
}

export async function handleOrderWebhook(req, res) {
  const topic = req.headers['x-wc-webhook-topic'];
  const payload = req.body;

  console.log(`[WEBHOOK] Received ${topic} for order #${payload.id}`);

  try {
    // Find which store this came from based on the source URL
    const store = await prisma.store.findFirst({ where: { isActive: true } });
    if (!store) {
      return res.status(200).json({ received: true, message: 'No active store' });
    }

    // Quick single-order sync
    await syncOrders(store);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[WEBHOOK] Error processing:', err);
    res.status(200).json({ received: true, error: err.message });
  }
}
