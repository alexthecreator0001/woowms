import type { ShippingProvider, Carrier, ShippingService, CreateShipmentParams, ShipmentResult } from './types.js';

const EASYPOST_BASE = 'https://api.easypost.com/v2';

// EasyPost Wallet Carriers — always available, billed through EasyPost wallet
const WALLET_CARRIERS: { id: string; name: string }[] = [
  { id: 'wallet_USPS', name: 'USPS (EasyPost Wallet)' },
  { id: 'wallet_UPS', name: 'UPS (EasyPost Wallet)' },
  { id: 'wallet_FedEx', name: 'FedEx (EasyPost Wallet)' },
  { id: 'wallet_DHLExpress', name: 'DHL Express (EasyPost Wallet)' },
  { id: 'wallet_DHLeCommerce', name: 'DHL eCommerce (EasyPost Wallet)' },
  { id: 'wallet_CanadaPost', name: 'Canada Post (EasyPost Wallet)' },
  { id: 'wallet_UPSMailInnovations', name: 'UPS Mail Innovations (EasyPost Wallet)' },
];

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
    // Fetch user's own carrier accounts
    let userCarriers: Carrier[] = [];
    try {
      const data = await easypostFetch('/carrier_accounts', apiKey);
      userCarriers = (data || []).map((ca: any) => ({
        id: ca.id,
        name: ca.readable || ca.type || ca.id,
      }));
    } catch { /* no user carriers */ }

    // Return wallet carriers + user's own carriers
    return [...WALLET_CARRIERS, ...userCarriers];
  },

  async getServices(apiKey: string, carrierId: string): Promise<ShippingService[]> {
    // Wallet carriers use predefined service lists
    if (carrierId.startsWith('wallet_')) {
      const carrierName = carrierId.replace('wallet_', '');
      const walletServices = WALLET_CARRIER_SERVICES[carrierName];
      if (walletServices) {
        return walletServices.map((s) => ({ ...s, carrierId }));
      }
      return [{ id: 'auto', name: 'Best rate (cheapest)', carrierId }];
    }

    // User carrier accounts — try fetching from API
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
    return [{ id: 'auto', name: 'Best rate (cheapest)', carrierId }];
  },

  async createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult> {
    const isWallet = params.carrierId.startsWith('wallet_');
    const carrierName = isWallet ? params.carrierId.replace('wallet_', '') : null;

    // Build shipment payload
    const shipmentPayload: Record<string, unknown> = {
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
    };

    // Only pass carrier_accounts for user's own carrier accounts (not wallet)
    if (!isWallet) {
      shipmentPayload.carrier_accounts = [params.carrierId];
    }

    const shipmentData = await easypostFetch('/shipments', apiKey, {
      method: 'POST',
      body: JSON.stringify({ shipment: shipmentPayload }),
    });

    // Find matching rate — filter by carrier for wallet, then by service
    let rates = shipmentData.rates || [];
    if (isWallet && carrierName) {
      rates = rates.filter((r: any) => r.carrier === carrierName);
    }
    let rate;
    if (params.serviceId && params.serviceId !== 'auto') {
      rate = rates.find((r: any) => r.service === params.serviceId);
    }
    if (!rate) {
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

// Common services for EasyPost wallet carriers
const WALLET_CARRIER_SERVICES: Record<string, { id: string; name: string }[]> = {
  USPS: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'First', name: 'USPS First Class' },
    { id: 'Priority', name: 'USPS Priority Mail' },
    { id: 'Express', name: 'USPS Priority Mail Express' },
    { id: 'GroundAdvantage', name: 'USPS Ground Advantage' },
    { id: 'ParcelSelect', name: 'USPS Parcel Select' },
    { id: 'LibraryMail', name: 'USPS Library Mail' },
    { id: 'MediaMail', name: 'USPS Media Mail' },
  ],
  UPS: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'Ground', name: 'UPS Ground' },
    { id: '3DaySelect', name: 'UPS 3 Day Select' },
    { id: '2ndDayAir', name: 'UPS 2nd Day Air' },
    { id: 'NextDayAirSaver', name: 'UPS Next Day Air Saver' },
    { id: 'NextDayAir', name: 'UPS Next Day Air' },
    { id: 'NextDayAirEarlyAM', name: 'UPS Next Day Air Early' },
    { id: 'Saver', name: 'UPS Saver (International)' },
    { id: 'Express', name: 'UPS Worldwide Express' },
    { id: 'Expedited', name: 'UPS Worldwide Expedited' },
  ],
  FedEx: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'FEDEX_GROUND', name: 'FedEx Ground' },
    { id: 'GROUND_HOME_DELIVERY', name: 'FedEx Home Delivery' },
    { id: 'FEDEX_EXPRESS_SAVER', name: 'FedEx Express Saver' },
    { id: 'FEDEX_2_DAY', name: 'FedEx 2Day' },
    { id: 'FEDEX_2_DAY_AM', name: 'FedEx 2Day AM' },
    { id: 'STANDARD_OVERNIGHT', name: 'FedEx Standard Overnight' },
    { id: 'PRIORITY_OVERNIGHT', name: 'FedEx Priority Overnight' },
    { id: 'FIRST_OVERNIGHT', name: 'FedEx First Overnight' },
    { id: 'INTERNATIONAL_ECONOMY', name: 'FedEx International Economy' },
    { id: 'INTERNATIONAL_PRIORITY', name: 'FedEx International Priority' },
  ],
  DHLExpress: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'ExpressWorldwide', name: 'DHL Express Worldwide' },
    { id: 'ExpressWorldwideEU', name: 'DHL Express Worldwide EU' },
    { id: 'Express1200', name: 'DHL Express 12:00' },
    { id: 'Express0900', name: 'DHL Express 09:00' },
  ],
  DHLeCommerce: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'DHLParcelExpedited', name: 'DHL Parcel Expedited' },
    { id: 'DHLParcelGround', name: 'DHL Parcel Ground' },
    { id: 'DHLBPMExpedited', name: 'DHL BPM Expedited' },
    { id: 'DHLBPMGround', name: 'DHL BPM Ground' },
  ],
  CanadaPost: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'RegularParcel', name: 'Regular Parcel' },
    { id: 'ExpeditedParcel', name: 'Expedited Parcel' },
    { id: 'Xpresspost', name: 'Xpresspost' },
    { id: 'Priority', name: 'Priority' },
    { id: 'SmallPacketAir', name: 'Small Packet Air (International)' },
    { id: 'TrackedPacket', name: 'Tracked Packet (International)' },
    { id: 'ExpeditedParcelUSA', name: 'Expedited Parcel USA' },
  ],
  UPSMailInnovations: [
    { id: 'auto', name: 'Best rate (cheapest)' },
    { id: 'First', name: 'First Class' },
    { id: 'Priority', name: 'Priority' },
    { id: 'ExpeditedMailInnovations', name: 'Expedited Mail Innovations' },
    { id: 'PriorityMailInnovations', name: 'Priority Mail Innovations' },
    { id: 'EconomyMailInnovations', name: 'Economy Mail Innovations' },
  ],
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
