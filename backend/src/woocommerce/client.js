import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const clients = new Map();

export function getWooClient(store) {
  const key = store.id || `${store.url}`;

  if (!clients.has(key)) {
    clients.set(
      key,
      new WooCommerceRestApi.default({
        url: store.url,
        consumerKey: store.consumerKey,
        consumerSecret: store.consumerSecret,
        version: 'wc/v3',
      })
    );
  }

  return clients.get(key);
}

export function clearClientCache(storeId) {
  clients.delete(storeId);
}
