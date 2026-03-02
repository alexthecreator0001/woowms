import type { ShippingProvider, Carrier, ShippingService, CreateShipmentParams, ShipmentResult } from './types.js';

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
    // Create a test shipment to discover available service levels for this carrier
    // Use standard US test addresses
    try {
      const shipment = await shippoFetch('/shipments', apiKey, {
        method: 'POST',
        body: JSON.stringify({
          address_from: {
            name: 'Test', street1: '215 Clayton St.', city: 'San Francisco',
            state: 'CA', zip: '94117', country: 'US',
          },
          address_to: {
            name: 'Test', street1: '965 Mission St.', city: 'San Francisco',
            state: 'CA', zip: '94105', country: 'US',
          },
          parcels: [{ length: '5', width: '5', height: '5', distance_unit: 'in', weight: '2', mass_unit: 'lb' }],
          async: false,
        }),
      });

      const rates = (shipment.rates || []).filter((r: any) => r.carrier_account === carrierId);
      const seen = new Set<string>();
      const services: ShippingService[] = [];

      for (const rate of rates) {
        const token = rate.servicelevel?.token;
        if (token && !seen.has(token)) {
          seen.add(token);
          services.push({
            id: token,
            name: rate.servicelevel?.name || token,
            carrierId,
          });
        }
      }

      return services.length > 0 ? services : [{ id: 'auto', name: 'Best available rate', carrierId }];
    } catch {
      return [{ id: 'auto', name: 'Best available rate', carrierId }];
    }
  },

  async createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult> {
    const distanceUnit = params.parcel.unit === 'kg' ? 'cm' : 'in';
    const massUnit = params.parcel.unit === 'kg' ? 'kg' : 'lb';

    // If we know the carrier + service, use single-call label creation (Workflow 2)
    if (params.carrierId && params.serviceId && params.serviceId !== 'auto') {
      const transaction = await shippoFetch('/transactions', apiKey, {
        method: 'POST',
        body: JSON.stringify({
          shipment: {
            address_from: formatAddress(params.fromAddress),
            address_to: formatAddress(params.toAddress),
            parcels: [{
              length: String(params.parcel.length),
              width: String(params.parcel.width),
              height: String(params.parcel.height),
              distance_unit: distanceUnit,
              weight: String(params.parcel.weight),
              mass_unit: massUnit,
            }],
          },
          carrier_account: params.carrierId,
          servicelevel_token: params.serviceId,
          label_file_type: 'PDF',
          async: false,
        }),
      });

      if (transaction.status !== 'SUCCESS') {
        throw new Error(`Label creation failed: ${JSON.stringify(transaction.messages)}`);
      }

      return {
        providerShipmentId: transaction.object_id,
        trackingNumber: transaction.tracking_number || '',
        labelUrl: transaction.label_url || '',
        trackingUrl: transaction.tracking_url_provider || '',
        rate: transaction.rate ? { amount: parseFloat(transaction.rate), currency: 'USD' } : undefined,
      };
    }

    // Workflow 1: Create shipment → get rates → pick best rate → purchase label
    const shipment = await shippoFetch('/shipments', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        address_from: formatAddress(params.fromAddress),
        address_to: formatAddress(params.toAddress),
        parcels: [{
          length: String(params.parcel.length),
          width: String(params.parcel.width),
          height: String(params.parcel.height),
          distance_unit: distanceUnit,
          weight: String(params.parcel.weight),
          mass_unit: massUnit,
        }],
        async: false,
      }),
    });

    // Find rate for the specified carrier, or cheapest overall
    const rates = shipment.rates || [];
    const rate = (params.carrierId
      ? rates.find((r: any) => r.carrier_account === params.carrierId)
      : null) || rates[0];

    if (!rate) {
      throw new Error('No shipping rates available for this shipment');
    }

    // Purchase the label
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
