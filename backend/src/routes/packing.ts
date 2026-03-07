import { Router, Request, Response, NextFunction } from 'express';
import { decrypt } from '../lib/crypto.js';
import { getProvider } from '../shipping/registry.js';
import { pushOrderStatus } from '../woocommerce/fetch.js';
import { notifyShippingLabel } from '../services/slack.js';

const router = Router();

// GET /api/v1/packing/queue — Orders ready for packing (PICKED or PACKING)
router.get('/queue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PICKED', 'PACKING'] },
        store: { tenantId: req.tenantId },
      },
      include: {
        items: { include: { product: { include: { stockLocations: { include: { bin: true }, take: 1 } } } } },
        pickLists: { include: { items: true } },
        shipments: true,
        store: true,
      },
      orderBy: [
        { priority: 'desc' },
        { wooCreatedAt: 'asc' },
      ],
    });

    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/packing/start — Start packing an order
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { orderId } = req.body as { orderId: number };

    if (!orderId) {
      return res.status(400).json({ error: true, message: 'orderId is required', code: 'VALIDATION_ERROR' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    if (order.status !== 'PICKED' && order.status !== 'PACKING') {
      return res.status(400).json({
        error: true,
        message: `Order must be in PICKED status to start packing (current: ${order.status})`,
        code: 'INVALID_STATUS',
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PACKING',
        notes: order.notes
          ? `${order.notes}\nPacking started by user ${req.user!.id} at ${new Date().toISOString()}`
          : `Packing started by user ${req.user!.id} at ${new Date().toISOString()}`,
      },
      include: {
        items: { include: { product: { include: { stockLocations: { include: { bin: true }, take: 1 } } } } },
        pickLists: { include: { items: true } },
        shipments: true,
        store: true,
      },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/packing/complete — Complete packing and generate shipping label
router.post('/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { orderId, weight, notes } = req.body as { orderId: number; weight?: number; notes?: string };

    if (!orderId) {
      return res.status(400).json({ error: true, message: 'orderId is required', code: 'VALIDATION_ERROR' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    if (order.status !== 'PACKING' && order.status !== 'PICKED') {
      return res.status(400).json({
        error: true,
        message: `Order must be in PACKING or PICKED status to complete packing (current: ${order.status})`,
        code: 'INVALID_STATUS',
      });
    }

    // --- Generate shipping label (reuses logic from shipping-config/label) ---

    if (!order.store.shippingProvider || !order.store.shippingApiKey) {
      return res.status(400).json({ error: true, message: 'No shipping provider configured', code: 'NO_PROVIDER' });
    }

    const provider = getProvider(order.store.shippingProvider);
    if (!provider) {
      return res.status(400).json({ error: true, message: 'Shipping provider not available', code: 'PROVIDER_ERROR' });
    }

    // Find shipping mapping for this order's shipping method
    let mapping = null;
    if (order.shippingMethod) {
      mapping = await prisma.shippingMapping.findUnique({
        where: { storeId_wooMethodId: { storeId: order.storeId, wooMethodId: order.shippingMethod } },
      });
    }

    if (!mapping?.providerCarrier) {
      return res.status(400).json({
        error: true,
        message: `No carrier mapping found for shipping method "${order.shippingMethodTitle || order.shippingMethod}". Configure this in Settings > Shipping.`,
        code: 'NO_MAPPING',
      });
    }

    // Parse addresses
    const shippingAddr = order.shippingAddress as Record<string, string>;
    const toAddress = {
      name: `${shippingAddr.first_name || ''} ${shippingAddr.last_name || ''}`.trim(),
      company: shippingAddr.company || undefined,
      street1: shippingAddr.address_1 || '',
      street2: shippingAddr.address_2 || undefined,
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      zip: shippingAddr.postcode || '',
      country: shippingAddr.country || '',
      phone: shippingAddr.phone || undefined,
    };

    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const tenantSettings = (tenant?.settings as Record<string, any>) || {};
    const returnAddress = tenantSettings.returnAddress || {};

    const fromAddress = {
      name: returnAddress.name || tenant?.name || 'Warehouse',
      company: returnAddress.company || '',
      street1: returnAddress.street1 || '',
      city: returnAddress.city || '',
      state: returnAddress.state || '',
      zip: returnAddress.zip || '',
      country: returnAddress.country || '',
      phone: returnAddress.phone || '',
    };

    const result = await provider.createShipment(decrypt(order.store.shippingApiKey), {
      fromAddress,
      toAddress,
      parcel: {
        weight: weight || tenantSettings.defaultParcelWeight || 1,
        length: tenantSettings.defaultParcelLength || 20,
        width: tenantSettings.defaultParcelWidth || 15,
        height: tenantSettings.defaultParcelHeight || 10,
        unit: tenantSettings.unitSystem === 'imperial' ? 'lb' : 'kg',
      },
      carrierId: mapping.providerCarrier,
      serviceId: mapping.providerService || 'auto',
    });

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: mapping.wooMethodTitle || mapping.providerCarrier,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        labelUrl: result.labelUrl,
        weight: weight || null,
        status: 'LABEL_CREATED',
      },
    });

    // Slack: shipping label notification
    notifyShippingLabel(req.tenantId!, {
      orderNumber: order.orderNumber,
      customerName: order.customerName || undefined,
      carrier: mapping.wooMethodTitle || mapping.providerCarrier,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
    });

    // Update order status to SHIPPED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        notes: notes
          ? (order.notes ? `${order.notes}\n${notes}` : notes)
          : order.notes,
      },
      include: {
        items: { include: { product: true } },
        shipments: true,
        store: true,
      },
    });

    // Push status back to WooCommerce if auto-push is enabled
    try {
      const settings = (tenant?.settings as Record<string, any>) || {};
      if (settings.autoStatusPush && settings.statusMapping) {
        const wooStatus = settings.statusMapping['SHIPPED'];
        if (wooStatus) {
          await pushOrderStatus(order.store as any, order.wooId, wooStatus);
        }
      }
    } catch (pushErr) {
      console.error(`[PACKING] Failed to push status to WooCommerce:`, (pushErr as Error).message);
    }

    res.json({ data: { order: updatedOrder, shipment, label: result } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/packing/skip — Skip label generation (manual ship)
router.post('/skip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { orderId } = req.body as { orderId: number };

    if (!orderId) {
      return res.status(400).json({ error: true, message: 'orderId is required', code: 'VALIDATION_ERROR' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });

    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    if (order.status !== 'PACKING' && order.status !== 'PICKED') {
      return res.status(400).json({
        error: true,
        message: `Order must be in PACKING or PICKED status to skip (current: ${order.status})`,
        code: 'INVALID_STATUS',
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
      include: {
        items: { include: { product: true } },
        shipments: true,
        store: true,
      },
    });

    // Push status back to WooCommerce if auto-push is enabled
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
      const settings = (tenant?.settings as Record<string, any>) || {};
      if (settings.autoStatusPush && settings.statusMapping) {
        const wooStatus = settings.statusMapping['SHIPPED'];
        if (wooStatus) {
          await pushOrderStatus(order.store as any, order.wooId, wooStatus);
        }
      }
    } catch (pushErr) {
      console.error(`[PACKING] Failed to push status to WooCommerce:`, (pushErr as Error).message);
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
