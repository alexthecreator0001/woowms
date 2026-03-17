import type { ShippingProvider, Carrier, ShippingService, CreateShipmentParams, ShipmentResult } from './types.js';

const EASYPOST_BASE = 'https://api.easypost.com/v2';

async function easypostFetch(path: string, apiKey: string, options: RequestInit = {}) {
  const res = await fetch(`${EASYPOST_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EasyPost API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const easypostProvider: ShippingProvider = {
  name: 'easypost',

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      // Use /addresses endpoint — lightweight, works for both test and production keys
      const res = await fetch(`${EASYPOST_BASE}/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: { street1: '1 Test St', city: 'Test', state: 'CA', zip: '90001', country: 'US' } }),
      });
      // 2xx or 422 (validation error) = key is valid; 401 = bad key
      return res.status !== 401 && res.status !== 403;
    } catch {
      return false;
    }
  },

  async getCarriers(apiKey: string): Promise<Carrier[]> {
    const data = await easypostFetch('/carrier_accounts', apiKey);
    return (data || []).map((ca: any) => ({
      id: ca.id,
      name: ca.readable || ca.type || ca.id,
    }));
  },

  async getServices(apiKey: string, carrierId: string): Promise<ShippingService[]> {
    try {
      const ca = await easypostFetch(`/carrier_accounts/${carrierId}`, apiKey);
      const services = ca?.credentials?.services;
      if (Array.isArray(services) && services.length > 0) {
        return services.map((s: any) => ({
          id: typeof s === 'string' ? s : s.name || s.id,
          name: typeof s === 'string' ? s : s.name || s.id,
          carrierId,
        }));
      }
    } catch { /* fall through to default */ }
    return [{ id: 'auto', name: 'Best rate', carrierId }];
  },

  async createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult> {
    // Create shipment
    const shipmentData = await easypostFetch('/shipments', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        shipment: {
          to_address: formatAddress(params.toAddress),
          from_address: formatAddress(params.fromAddress),
          parcel: {
            length: params.parcel.length,
            width: params.parcel.width,
            height: params.parcel.height,
            weight: params.parcel.unit === 'kg'
              ? Math.round(params.parcel.weight * 35.274)  // kg to oz
              : Math.round(params.parcel.weight * 16),     // lb to oz
          },
          carrier_accounts: [params.carrierId],
        },
      }),
    });

    // Find cheapest rate (optionally matching service)
    const rates = shipmentData.rates || [];
    let rate;
    if (params.serviceId && params.serviceId !== 'auto') {
      rate = rates.find((r: any) => r.service === params.serviceId);
    }
    if (!rate) {
      // Pick cheapest
      rate = rates.sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))[0];
    }

    if (!rate) {
      throw new Error('No shipping rates available for this shipment');
    }

    // Buy the rate
    const purchased = await easypostFetch(`/shipments/${shipmentData.id}/buy`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ rate: { id: rate.id } }),
    });

    return {
      providerShipmentId: purchased.id,
      trackingNumber: purchased.tracking_code || '',
      labelUrl: purchased.postage_label?.label_url || '',
      trackingUrl: purchased.tracker?.public_url || '',
      rate: rate ? { amount: parseFloat(rate.rate), currency: rate.currency || 'USD' } : undefined,
    };
  },
};

function formatAddress(addr: CreateShipmentParams['fromAddress']) {
  return {
    name: addr.name,
    company: addr.company || '',
    street1: addr.street1,
    street2: addr.street2 || '',
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country,
    phone: addr.phone || '',
    email: addr.email || '',
  };
}
