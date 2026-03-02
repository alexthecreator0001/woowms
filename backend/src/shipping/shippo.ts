import type { ShippingProvider, Carrier, ShippingService, CreateShipmentParams, ShipmentResult } from './types.js';

// Shippo uses REST API — we call it directly with fetch
const SHIPPO_BASE = 'https://api.goshippo.com';

async function shippoFetch(path: string, apiKey: string, options: RequestInit = {}) {
  const res = await fetch(`${SHIPPO_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `ShippoToken ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shippo API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const shippoProvider: ShippingProvider = {
  name: 'shippo',

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      await shippoFetch('/addresses', apiKey, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  },

  async getCarriers(apiKey: string): Promise<Carrier[]> {
    const data = await shippoFetch('/carrier_accounts', apiKey);
    return (data.results || []).map((c: any) => ({
      id: c.object_id,
      name: c.carrier || c.carrier_name || c.object_id,
    }));
  },

  async getServices(apiKey: string, carrierId: string): Promise<ShippingService[]> {
    // Shippo doesn't have a per-carrier service list endpoint
    // Services are returned when creating a shipment/getting rates
    // For now, return common services based on carrier name
    const carriers = await shippoProvider.getCarriers(apiKey);
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return [];

    // Use rates endpoint to discover services
    return [{ id: 'auto', name: 'Best available rate', carrierId }];
  },

  async createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult> {
    const shipment = await shippoFetch('/shipments', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        address_from: {
          name: params.fromAddress.name,
          company: params.fromAddress.company || '',
          street1: params.fromAddress.street1,
          street2: params.fromAddress.street2 || '',
          city: params.fromAddress.city,
          state: params.fromAddress.state,
          zip: params.fromAddress.zip,
          country: params.fromAddress.country,
          phone: params.fromAddress.phone || '',
          email: params.fromAddress.email || '',
        },
        address_to: {
          name: params.toAddress.name,
          company: params.toAddress.company || '',
          street1: params.toAddress.street1,
          street2: params.toAddress.street2 || '',
          city: params.toAddress.city,
          state: params.toAddress.state,
          zip: params.toAddress.zip,
          country: params.toAddress.country,
          phone: params.toAddress.phone || '',
          email: params.toAddress.email || '',
        },
        parcels: [{
          length: String(params.parcel.length),
          width: String(params.parcel.width),
          height: String(params.parcel.height),
          weight: String(params.parcel.weight),
          distance_unit: params.parcel.unit === 'kg' ? 'cm' : 'in',
          mass_unit: params.parcel.unit,
        }],
        async: false,
      }),
    });

    // Get best rate
    const rates = shipment.rates || [];
    const rate = rates.find((r: any) => r.carrier_account === params.carrierId) || rates[0];

    if (!rate) {
      throw new Error('No shipping rates available for this shipment');
    }

    // Purchase the label via transaction
    const transaction = await shippoFetch('/transactions', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        rate: rate.object_id,
        label_file_type: 'PDF',
        async: false,
      }),
    });

    if (transaction.status !== 'SUCCESS') {
      throw new Error(`Label creation failed: ${JSON.stringify(transaction.messages)}`);
    }

    return {
      providerShipmentId: shipment.object_id,
      trackingNumber: transaction.tracking_number || '',
      labelUrl: transaction.label_url || '',
      trackingUrl: transaction.tracking_url_provider || '',
      rate: rate ? { amount: parseFloat(rate.amount), currency: rate.currency } : undefined,
    };
  },
};
