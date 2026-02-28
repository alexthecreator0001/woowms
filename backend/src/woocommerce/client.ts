import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { decrypt } from '../lib/crypto.js';
import type { Store } from '@prisma/client';

const clients = new Map<number | string, WooCommerceRestApi>();

export function getWooClient(store: Pick<Store, 'id' | 'url' | 'consumerKey' | 'consumerSecret'>): WooCommerceRestApi {
  const key = store.id || `${store.url}`;

  if (!clients.has(key)) {
    clients.set(
      key,
      new (WooCommerceRestApi as any).default({
        url: store.url,
        consumerKey: decrypt(store.consumerKey),
        consumerSecret: decrypt(store.consumerSecret),
        version: 'wc/v3',
      })
    );
  }

  return clients.get(key)!;
}

export function clearClientCache(storeId: number): void {
  clients.delete(storeId);
}
