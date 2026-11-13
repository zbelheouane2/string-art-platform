import type { PaymentProvider } from "./types";

/** Paiement à la livraison : le livreur encaisse, la commande est confirmée par téléphone. */
export const cashOnDelivery: PaymentProvider = {
  id: "cash_on_delivery",
  isConfigured: () => true,
  start: async () => ({ kind: "offline" }),
};
