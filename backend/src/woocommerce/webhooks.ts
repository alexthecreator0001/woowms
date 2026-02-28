import crypto from 'crypto';
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { syncOrders } from './sync.js';

/**
 * Per-store webhook handler.
 * Route: POST /api/webhooks/woocommerce/:storeId
 * No JWT auth — uses HMAC signature verification instead.
 */
export async function handleStoreWebhook(req: Request, res: Response): Promise<void> {
  const storeId = parseInt(req.params.storeId);

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isActive) {
      res.status(404).json({ error: true, message: 'Store not found' });
      return;
    }

    // Verify HMAC signature
    if (store.webhookSecret) {
      const signature = req.headers['x-wc-webhook-signature'] as string | undefined;
      if (!signature) {
        res.status(401).json({ error: true, message: 'No webhook signature' });
        return;
      }

      const hash = crypto
        .createHmac('sha256', store.webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (hash !== signature) {
        res.status(401).json({ error: true, message: 'Invalid webhook signature' });
        return;
      }
    }

    const topic = req.headers['x-wc-webhook-topic'] as string | undefined;
    console.log(`[WEBHOOK] Store #${storeId}: received ${topic}`);

    await syncOrders(store);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[WEBHOOK] Store #${storeId} error:`, err);
    res.status(200).json({ received: true, error: (err as Error).message });
  }
}
