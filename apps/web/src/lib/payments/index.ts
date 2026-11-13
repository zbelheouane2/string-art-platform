import { cashOnDelivery } from "./cod";
import type { PaymentProvider } from "./types";

/**
 * Adaptateurs disponibles. Un moyen de paiement actif en base mais sans
 * adaptateur configuré (ex. CIB/EDAHABIA tant que le prestataire n'est pas
 * choisi) n'est pas proposé au client.
 */
const PROVIDERS: Record<string, PaymentProvider> = {
  [cashOnDelivery.id]: cashOnDelivery,
};

export function paymentProvider(id: string): PaymentProvider | null {
  const p = PROVIDERS[id];
  return p && p.isConfigured() ? p : null;
}

export type { PaymentProvider, PaymentStart, PaymentContext } from "./types";
