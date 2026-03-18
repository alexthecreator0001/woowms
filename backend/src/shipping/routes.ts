import { Router, Request, Response, NextFunction } from 'express';
import { authorize } from '../middleware/auth.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { getProvider, listProviders } from './registry.js';
import { fetchShippingMethods } from '../woocommerce/fetch.js';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// Helper: resolve shipping provider from Store or TenantPlugin fallback.
// When a store is reconnected, the new Store may not have shippingProvider set,
// but the TenantPlugin still exists. This syncs them and returns the resolved info.
async function resolveShippingProvider(prisma: PrismaClient, tenantId: number) {
  const store = await prisma.store.findFirst({
    where: { tenantId, isActive: true },
  });
  if (!store) return null;

  // If store already has provider, use it
  if (store.shippingProvider && store.shippingApiKey) {
    return { store, providerName: store.shippingProvider, apiKey: decrypt(store.shippingApiKey) };
  }

  // Fallback: check TenantPlugin for a shipping plugin
  const shippingPlugin = await prisma.tenantPlugin.findFirst({
    where: {
      tenantId,
      isEnabled: true,
      pluginKey: { in: ['shippo', 'easypost'] },
    },
  });

  if (shippingPlugin) {
    const settings = (shippingPlugin as any).settings as Record<string, string> | null;
    const providerName = shippingPlugin.pluginKey;
    let encryptedKey = settings?._encryptedApiKey;

    // Fallback: check if an older (inactive) store has the key
    if (!encryptedKey) {
      const oldStore = await prisma.store.findFirst({
        where: { tenantId, shippingProvider: providerName, shippingApiKey: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
      if (oldStore?.shippingApiKey) {
        encryptedKey = oldStore.shippingApiKey;
      }
    }

    if (providerName && encryptedKey) {
      // Sync back to the store so future lookups are fast
      await prisma.store.update({
        where: { id: store.id },
        data: { shippingProvider: providerName, shippingApiKey: encryptedKey },
      });
      return { store, providerName, apiKey: decrypt(encryptedKey) };
    }
  }

  return null;
}

// GET /api/v1/shipping-config/providers — list available providers
router.get('/providers', async (_req: Request, res: Response) => {
  res.json({ data: listProviders() });
});

// POST /api/v1/shipping-config/validate — test API key for a provider
router.post('/validate', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider: providerName, apiKey } = req.body;
    const provider = getProvider(providerName);
    if (!provider) {
      return res.status(400).json({ error: true, message: `Unknown provider: ${providerName}`, code: 'VALIDATION_ERROR' });
    }
    const valid = await provider.validateCredentials(apiKey);
    res.json({ data: { valid } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipping-config/carriers — get carriers from connected provider
router.get('/carriers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveShippingProvider(req.prisma!, req.tenantId);
    if (!resolved) return res.json({ data: [] });

    const provider = getProvider(resolved.providerName);
    if (!provider) return res.json({ data: [] });

    const carriers = await provider.getCarriers(resolved.apiKey);
    res.json({ data: carriers });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipping-config/services/:carrier — get services for a carrier
router.get('/services/:carrier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resolved = await resolveShippingProvider(req.prisma!, req.tenantId);
    if (!resolved) return res.json({ data: [] });

    const provider = getProvider(resolved.providerName);
    if (!provider) return res.json({ data: [] });

    const services = await provider.getServices(resolved.apiKey, req.params.carrier);
    res.json({ data: services });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipping-config/mappings — get store's shipping mappings
router.get('/mappings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const store = await prisma.store.findFirst({
      where: { tenantId: req.tenantId, isActive: true },
    });
    if (!store) return res.json({ data: [] });

    const mappings = await prisma.shippingMapping.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: mappings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/shipping-config/mappings — save shipping mappings
router.put('/mappings', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { mappings } = req.body as {
      mappings: Array<{
        wooMethodId: string;
        wooMethodTitle: string;
        providerCarrier?: string;
        providerService?: string;
      }>;
    };

    const store = await prisma.store.findFirst({
      where: { tenantId: req.tenantId, isActive: true },
    });
    if (!store) {
      return res.status(404).json({ error: true, message: 'No active store', code: 'NOT_FOUND' });
    }

    // Upsert all mappings
    const results = [];
    for (const m of mappings) {
      const result = await prisma.shippingMapping.upsert({
        where: { storeId_wooMethodId: { storeId: store.id, wooMethodId: m.wooMethodId } },
        update: {
          wooMethodTitle: m.wooMethodTitle,
          providerCarrier: m.providerCarrier || null,
          providerService: m.providerService || null,
        },
        create: {
          storeId: store.id,
          wooMethodId: m.wooMethodId,
          wooMethodTitle: m.wooMethodTitle,
          providerCarrier: m.providerCarrier || null,
          providerService: m.providerService || null,
        },
      });
      results.push(result);
    }

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/shipping-config/store — update store shipping provider
router.patch('/store', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { shippingProvider, shippingApiKey } = req.body;

    const store = await prisma.store.findFirst({
      where: { tenantId: req.tenantId, isActive: true },
    });
    if (!store) {
      return res.status(404).json({ error: true, message: 'No active store', code: 'NOT_FOUND' });
    }

    const data: Record<string, unknown> = {};
    if (shippingProvider !== undefined) data.shippingProvider = shippingProvider || null;
    if (shippingApiKey !== undefined) data.shippingApiKey = shippingApiKey ? encrypt(shippingApiKey) : null;

    await prisma.store.update({ where: { id: store.id }, data });

    res.json({ data: { message: 'Shipping provider updated' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipping-config/woo-methods — fetch shipping methods from WooCommerce
router.get('/woo-methods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const store = await prisma.store.findFirst({
      where: { tenantId: req.tenantId, isActive: true },
    });
    if (!store) {
      return res.status(404).json({ error: true, message: 'No active store', code: 'NOT_FOUND' });
    }

    const methods = await fetchShippingMethods(store);
    res.json({ data: methods });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/shipping-config/label — create a shipping label for an order
router.post('/label', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prisma = req.prisma!;
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true },
    });
    if (!order || order.store.tenantId !== req.tenantId) {
      return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
    }

    // Resolve provider — try store fields first, fall back to TenantPlugin
    let providerName = order.store.shippingProvider;
    let apiKey = order.store.shippingApiKey ? decrypt(order.store.shippingApiKey) : null;

    if (!providerName || !apiKey) {
      const resolved = await resolveShippingProvider(prisma, req.tenantId);
      if (resolved) {
        providerName = resolved.providerName;
        apiKey = resolved.apiKey;
      }
    }

    if (!providerName || !apiKey) {
      return res.status(400).json({ error: true, message: 'No shipping provider configured', code: 'NO_PROVIDER' });
    }

    const provider = getProvider(providerName);
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

    // Use store URL as from address placeholder — in production, use tenant's return address from settings
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

    const result = await provider.createShipment(apiKey, {
      fromAddress,
      toAddress,
      parcel: {
        weight: tenantSettings.defaultParcelWeight || 1,
        length: tenantSettings.defaultParcelLength || 20,
        width: tenantSettings.defaultParcelWidth || 15,
        height: tenantSettings.defaultParcelHeight || 10,
        unit: tenantSettings.unitSystem === 'imperial' ? 'lb' : 'kg',
      },
      carrierId: mapping.providerCarrier,
      serviceId: mapping.providerService || 'auto',
    });

    // Create or update shipment record
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        carrier: mapping.wooMethodTitle || mapping.providerCarrier,
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        labelUrl: result.labelUrl,
        status: 'LABEL_CREATED',
      },
    });

    res.json({ data: { shipment, label: result } });
  } catch (err) {
    next(err);
  }
});

export default router;
