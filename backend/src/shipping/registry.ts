import type { ShippingProvider } from './types.js';

const providers = new Map<string, ShippingProvider>();

export function registerProvider(provider: ShippingProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): ShippingProvider | undefined {
  return providers.get(name);
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}
