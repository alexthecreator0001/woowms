export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Carrier {
  id: string;
  name: string;
}

export interface ShippingService {
  id: string;
  name: string;
  carrierId: string;
}

export interface CreateShipmentParams {
  fromAddress: Address;
  toAddress: Address;
  parcel: { weight: number; length: number; width: number; height: number; unit: 'kg' | 'lb' };
  carrierId: string;
  serviceId: string;
}

export interface ShipmentResult {
  providerShipmentId: string;
  trackingNumber: string;
  labelUrl: string;
  trackingUrl: string;
  rate?: { amount: number; currency: string };
}

export interface ShippingProvider {
  name: string;
  validateCredentials(apiKey: string): Promise<boolean>;
  getCarriers(apiKey: string): Promise<Carrier[]>;
  getServices(apiKey: string, carrierId: string): Promise<ShippingService[]>;
  createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult>;
}
