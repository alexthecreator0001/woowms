import prisma from '../lib/prisma.js';

// ─── Types ────────────────────────────────────────

interface SlackSettings {
  webhookUrl: string;
  sendOrderNotifications?: boolean;
  sendLowStockAlerts?: boolean;
  sendShippingUpdates?: boolean;
  sendPOReceivedAlerts?: boolean;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  total: string;
  currency: string;
  itemCount: number;
  isPaid?: boolean;
}

interface LowStockData {
  name: string;
  sku: string | null;
  stockQty: number;
  lowStockThreshold: number;
}

interface ShippingLabelData {
  orderNumber: string;
  customerName?: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

interface POReceivedData {
  poNumber: string;
  supplier: string;
  itemCount: number;
  totalQty: number;
}

// ─── Internal helpers ─────────────────────────────

async function getSlackConfig(tenantId: number): Promise<SlackSettings | null> {
  try {
    const plugin = await prisma.tenantPlugin.findFirst({
      where: { tenantId, pluginKey: 'slack', isEnabled: true },
    });
    if (!plugin) return null;
    const settings = (plugin.settings as Record<string, unknown>) || {};
    if (!settings.webhookUrl) return null;
    return settings as unknown as SlackSettings;
  } catch {
    return null;
  }
}

async function postToSlack(webhookUrl: string, payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('[SLACK] Failed to post notification:', (err as Error).message);
    return false;
  }
}

// ─── Public: validate webhook ─────────────────────

export async function validateSlackWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: ':white_check_mark: *PickNPack connected successfully!*\nYou will receive warehouse notifications in this channel.' },
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Public: fire-and-forget notification functions ─

export function notifyNewOrder(tenantId: number, order: OrderData): void {
  (async () => {
    const config = await getSlackConfig(tenantId);
    if (!config?.sendOrderNotifications) return;

    const paymentStatus = order.isPaid ? ':white_check_mark: Paid' : ':warning: Unpaid';

    await postToSlack(config.webhookUrl, {
      attachments: [{
        color: '#36a64f',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:package: *New Order #${order.orderNumber}*`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Customer*\n${order.customerName}` },
              { type: 'mrkdwn', text: `*Total*\n${order.currency} ${order.total}` },
              { type: 'mrkdwn', text: `*Items*\n${order.itemCount}` },
              { type: 'mrkdwn', text: `*Payment*\n${paymentStatus}` },
            ],
          },
        ],
      }],
    });
  })().catch((err) => console.error('[SLACK] notifyNewOrder error:', (err as Error).message));
}

export function notifyLowStock(tenantId: number, product: LowStockData): void {
  (async () => {
    const config = await getSlackConfig(tenantId);
    if (!config?.sendLowStockAlerts) return;

    await postToSlack(config.webhookUrl, {
      attachments: [{
        color: '#e01e5a',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:warning: *Low Stock Alert*`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Product*\n${product.name}` },
              { type: 'mrkdwn', text: `*SKU*\n${product.sku || '—'}` },
              { type: 'mrkdwn', text: `*Current Stock*\n${product.stockQty}` },
              { type: 'mrkdwn', text: `*Threshold*\n${product.lowStockThreshold}` },
            ],
          },
        ],
      }],
    });
  })().catch((err) => console.error('[SLACK] notifyLowStock error:', (err as Error).message));
}

export function notifyShippingLabel(tenantId: number, data: ShippingLabelData): void {
  (async () => {
    const config = await getSlackConfig(tenantId);
    if (!config?.sendShippingUpdates) return;

    const trackingText = data.trackingUrl
      ? `<${data.trackingUrl}|${data.trackingNumber}>`
      : data.trackingNumber;

    await postToSlack(config.webhookUrl, {
      attachments: [{
        color: '#2eb886',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:label: *Shipping Label Created — Order #${data.orderNumber}*`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Carrier*\n${data.carrier}` },
              { type: 'mrkdwn', text: `*Tracking*\n${trackingText}` },
              ...(data.customerName ? [{ type: 'mrkdwn', text: `*Customer*\n${data.customerName}` }] : []),
            ],
          },
        ],
      }],
    });
  })().catch((err) => console.error('[SLACK] notifyShippingLabel error:', (err as Error).message));
}

export function notifyPOReceived(tenantId: number, po: POReceivedData): void {
  (async () => {
    const config = await getSlackConfig(tenantId);
    if (!config?.sendPOReceivedAlerts) return;

    await postToSlack(config.webhookUrl, {
      attachments: [{
        color: '#4a154b',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:white_check_mark: *Purchase Order Fully Received*`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*PO Number*\n${po.poNumber}` },
              { type: 'mrkdwn', text: `*Supplier*\n${po.supplier}` },
              { type: 'mrkdwn', text: `*Items*\n${po.itemCount} line items` },
              { type: 'mrkdwn', text: `*Total Qty*\n${po.totalQty} units` },
            ],
          },
        ],
      }],
    });
  })().catch((err) => console.error('[SLACK] notifyPOReceived error:', (err as Error).message));
}
