import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

// ─── Plugin catalog (hardcoded) ────────────────────

const PLUGIN_CATALOG = [
  {
    key: 'zapier',
    name: 'Zapier',
    description: 'Connect your WMS to 5,000+ apps. Automate order notifications, inventory alerts, and more.',
    category: 'Automation',
    icon: 'zapier',
    requiresApiKey: true,
    status: 'available' as const,
  },
  {
    key: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications for orders, low stock alerts, and shipping updates in Slack.',
    category: 'Notifications',
    icon: 'slack',
    requiresApiKey: false,
    status: 'coming_soon' as const,
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync orders and inventory with QuickBooks for seamless accounting.',
    category: 'Accounting',
    icon: 'quickbooks',
    requiresApiKey: false,
    status: 'coming_soon' as const,
  },
  {
    key: 'shipstation',
    name: 'ShipStation',
    description: 'Streamline shipping with multi-carrier rate comparison and label printing.',
    category: 'Shipping',
    icon: 'shipstation',
    requiresApiKey: false,
    status: 'coming_soon' as const,
  },
];

// ─── Helpers ───────────────────────────────────────

function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const plaintext = `pk_${raw}`;
  const hash = crypto.createHash('sha256').update(plaintext).digest('hex');
  const prefix = plaintext.slice(0, 11); // "pk_" + first 8 hex chars
  return { plaintext, hash, prefix };
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// ═══════════════════════════════════════════════════
// Authenticated CRUD router (mounted after JWT middleware)
// ═══════════════════════════════════════════════════

const router = Router();

// GET / — list catalog merged with tenant's installed plugins
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const installed = await req.prisma!.tenantPlugin.findMany();
    const installedMap = new Map(installed.map((p: any) => [p.pluginKey, p]));

    const catalog = PLUGIN_CATALOG.map((plugin) => {
      const inst = installedMap.get(plugin.key) as any;
      return {
        ...plugin,
        installed: !!inst,
        isEnabled: inst?.isEnabled ?? false,
        apiKeyPrefix: inst?.apiKeyPrefix ?? null,
        settings: inst?.settings ?? {},
        installedAt: inst?.installedAt ?? null,
      };
    });

    res.json({ data: catalog });
  } catch (err) {
    next(err);
  }
});

// GET /:key — single plugin detail
router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const catalogItem = PLUGIN_CATALOG.find((p) => p.key === key);
    if (!catalogItem) {
      return res.status(404).json({ error: true, message: 'Plugin not found', code: 'NOT_FOUND' });
    }

    const inst = await req.prisma!.tenantPlugin.findFirst({ where: { pluginKey: key } }) as any;

    res.json({
      data: {
        ...catalogItem,
        installed: !!inst,
        isEnabled: inst?.isEnabled ?? false,
        apiKeyPrefix: inst?.apiKeyPrefix ?? null,
        settings: inst?.settings ?? {},
        installedAt: inst?.installedAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /:key/install — install plugin
router.post('/:key/install', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const catalogItem = PLUGIN_CATALOG.find((p) => p.key === key);
    if (!catalogItem) {
      return res.status(404).json({ error: true, message: 'Plugin not found', code: 'NOT_FOUND' });
    }
    if (catalogItem.status !== 'available') {
      return res.status(400).json({ error: true, message: 'Plugin is not yet available', code: 'NOT_AVAILABLE' });
    }

    // Check if already installed
    const existing = await req.prisma!.tenantPlugin.findFirst({ where: { pluginKey: key } });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Plugin already installed', code: 'ALREADY_INSTALLED' });
    }

    let apiKeyPlaintext: string | null = null;
    let apiKeyHash: string | null = null;
    let apiKeyPrefix: string | null = null;

    if (catalogItem.requiresApiKey) {
      const generated = generateApiKey();
      apiKeyPlaintext = generated.plaintext;
      apiKeyHash = generated.hash;
      apiKeyPrefix = generated.prefix;
    }

    const plugin = await req.prisma!.tenantPlugin.create({
      data: {
        pluginKey: key,
        apiKeyHash,
        apiKeyPrefix,
        settings: {},
      },
    });

    res.status(201).json({
      data: {
        ...catalogItem,
        installed: true,
        isEnabled: true,
        apiKeyPrefix,
        apiKey: apiKeyPlaintext, // Only returned on install
        settings: {},
        installedAt: (plugin as any).installedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /:key/uninstall — uninstall plugin
router.post('/:key/uninstall', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const existing = await req.prisma!.tenantPlugin.findFirst({ where: { pluginKey: key } });
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Plugin not installed', code: 'NOT_INSTALLED' });
    }

    await req.prisma!.tenantPlugin.delete({ where: { id: (existing as any).id } });
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// PATCH /:key/settings — update plugin settings
router.patch('/:key/settings', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const existing = await req.prisma!.tenantPlugin.findFirst({ where: { pluginKey: key } }) as any;
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Plugin not installed', code: 'NOT_INSTALLED' });
    }

    const currentSettings = (existing.settings as Record<string, unknown>) || {};
    const newSettings = { ...currentSettings, ...req.body };

    await req.prisma!.tenantPlugin.update({
      where: { id: existing.id },
      data: { settings: newSettings },
    });

    res.json({ data: { settings: newSettings } });
  } catch (err) {
    next(err);
  }
});

// POST /:key/regenerate-key — regenerate API key
router.post('/:key/regenerate-key', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const existing = await req.prisma!.tenantPlugin.findFirst({ where: { pluginKey: key } }) as any;
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Plugin not installed', code: 'NOT_INSTALLED' });
    }

    const catalogItem = PLUGIN_CATALOG.find((p) => p.key === key);
    if (!catalogItem?.requiresApiKey) {
      return res.status(400).json({ error: true, message: 'This plugin does not use API keys', code: 'NO_API_KEY' });
    }

    const generated = generateApiKey();

    await req.prisma!.tenantPlugin.update({
      where: { id: existing.id },
      data: {
        apiKeyHash: generated.hash,
        apiKeyPrefix: generated.prefix,
      },
    });

    res.json({
      data: {
        apiKey: generated.plaintext,
        apiKeyPrefix: generated.prefix,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════
// Zapier webhook router (mounted BEFORE JWT middleware)
// Uses X-API-Key header auth instead of JWT
// ═══════════════════════════════════════════════════

export const zapierWebhookRouter = Router();

// Middleware: authenticate via X-API-Key header
async function zapierAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (!apiKey) {
    return res.status(401).json({ error: true, message: 'Missing X-API-Key header', code: 'NO_API_KEY' });
  }

  const hash = hashApiKey(apiKey);

  const plugin = await prisma.tenantPlugin.findFirst({
    where: {
      pluginKey: 'zapier',
      apiKeyHash: hash,
      isEnabled: true,
    },
    include: { tenant: true },
  });

  if (!plugin) {
    return res.status(401).json({ error: true, message: 'Invalid API key', code: 'INVALID_API_KEY' });
  }

  (req as any).zapierTenantId = plugin.tenantId;
  (req as any).zapierTenant = plugin.tenant;
  next();
}

// POST / — Zapier trigger endpoint (mounted at /api/v1/zapier/webhook)
zapierWebhookRouter.post('/', zapierAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).zapierTenantId;
    const tenant = (req as any).zapierTenant;
    const { action } = req.body || {};

    switch (action) {
      case 'test': {
        return res.json({ data: { ok: true, company: tenant.name } });
      }

      case 'new_orders': {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const orders = await prisma.order.findMany({
          where: {
            store: { tenantId },
            createdAt: { gte: since },
          },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return res.json({ data: orders });
      }

      case 'low_stock': {
        const allProducts = await prisma.product.findMany({
          where: {
            store: { tenantId },
            isActive: true,
          },
          orderBy: { stockQty: 'asc' },
        });
        const lowStock = allProducts.filter((p) => p.stockQty <= p.lowStockThreshold);
        return res.json({ data: lowStock.slice(0, 50) });
      }

      case 'order_status': {
        const { orderId } = req.body;
        if (!orderId) {
          return res.status(400).json({ error: true, message: 'orderId is required', code: 'VALIDATION_ERROR' });
        }
        const order = await prisma.order.findFirst({
          where: { id: Number(orderId), store: { tenantId } },
          include: { items: true, shipments: true },
        });
        if (!order) {
          return res.status(404).json({ error: true, message: 'Order not found', code: 'NOT_FOUND' });
        }
        return res.json({ data: order });
      }

      default:
        return res.status(400).json({ error: true, message: `Unknown action: ${action}`, code: 'UNKNOWN_ACTION' });
    }
  } catch (err) {
    next(err);
  }
});

// GET /test — test connection (mounted at /api/v1/zapier/webhook/test)
zapierWebhookRouter.get('/test', zapierAuth, async (req: Request, res: Response) => {
  const tenant = (req as any).zapierTenant;
  res.json({ data: { ok: true, company: tenant.name, timestamp: new Date().toISOString() } });
});

export default router;
