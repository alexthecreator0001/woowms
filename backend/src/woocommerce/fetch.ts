import type { Store } from '@prisma/client';
import { getWooClient } from './client.js';

interface WooShippingZone {
  id: number;
  name: string;
}

interface WooShippingMethod {
  id: number;
  instance_id: number;
  title: string;
  method_id: string;
  method_title: string;
  enabled: boolean;
  settings?: Record<string, { value: string }>;
}

interface WooPaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  method_title: string;
}

interface WooOrderStatusCount {
  slug: string;
  name: string;
  total: number;
}

export interface FetchedShippingMethod {
  methodId: string;      // "flat_rate:1"
  title: string;         // "Flat Rate"
  methodType: string;    // "flat_rate"
  enabled: boolean;
  zoneName: string;
}

export interface FetchedPaymentGateway {
  id: string;            // "bacs", "cod", "stripe"
  title: string;         // "Direct Bank Transfer"
  enabled: boolean;
  isCod: boolean;        // auto-detected
}

export interface FetchedOrderStatus {
  slug: string;          // "wc-processing"
  name: string;          // "Processing"
  total: number;
}

export async function fetchShippingMethods(store: Store): Promise<FetchedShippingMethod[]> {
  const woo = getWooClient(store);
  const methods: FetchedShippingMethod[] = [];

  try {
    const { data: zones } = await woo.get<WooShippingZone[]>('shipping/zones');

    for (const zone of zones) {
      try {
        const { data: zoneMethods } = await woo.get<WooShippingMethod[]>(
          `shipping/zones/${zone.id}/methods`
        );

        for (const method of zoneMethods) {
          methods.push({
            methodId: `${method.method_id}:${method.instance_id}`,
            title: method.title || method.method_title,
            methodType: method.method_id,
            enabled: method.enabled,
            zoneName: zone.name,
          });
        }
      } catch {
        console.log(`[WOO] Could not fetch methods for zone ${zone.name}`);
      }
    }
  } catch {
    console.log(`[WOO] Could not fetch shipping zones`);
  }

  return methods;
}

export async function fetchPaymentGateways(store: Store): Promise<FetchedPaymentGateway[]> {
  const woo = getWooClient(store);

  try {
    const { data: gateways } = await woo.get<WooPaymentGateway[]>('payment_gateways');

    return gateways.map((g) => ({
      id: g.id,
      title: g.title || g.method_title,
      enabled: g.enabled,
      isCod: g.id === 'cod',
    }));
  } catch {
    console.log(`[WOO] Could not fetch payment gateways`);
    return [];
  }
}

export async function fetchOrderStatuses(store: Store): Promise<FetchedOrderStatus[]> {
  const woo = getWooClient(store);

  try {
    const { data: statuses } = await woo.get<WooOrderStatusCount[]>('reports/orders/totals');

    return statuses.map((s) => ({
      slug: s.slug.startsWith('wc-') ? s.slug : `wc-${s.slug}`,
      name: s.name,
      total: s.total,
    }));
  } catch {
    console.log(`[WOO] Could not fetch order statuses`);
    return [];
  }
}

export async function pushOrderStatus(store: Store, wooOrderId: number, wooStatus: string): Promise<void> {
  const woo = getWooClient(store);
  // Strip 'wc-' prefix if present — WooCommerce API expects status without prefix
  const status = wooStatus.startsWith('wc-') ? wooStatus.slice(3) : wooStatus;
  await woo.put(`orders/${wooOrderId}`, { status });
}
