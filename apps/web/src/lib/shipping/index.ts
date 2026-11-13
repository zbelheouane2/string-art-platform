import type { ShippingProvider } from "./types";

/**
 * Transporteurs branchés. Aucun pour l'instant : les colis sont saisis à la
 * main chez le transporteur à partir de la Google Sheet des commandes. Dès
 * qu'un compte marchand existe (Yalidine, ZR Express…), son adaptateur
 * s'ajoute ici et la création du colis devient automatique.
 */
const PROVIDERS: Record<string, ShippingProvider> = {};

export function shippingProvider(id: string): ShippingProvider | null {
  const p = PROVIDERS[id];
  return p && p.isConfigured() ? p : null;
}

export type { Parcel, ShippingProvider } from "./types";
