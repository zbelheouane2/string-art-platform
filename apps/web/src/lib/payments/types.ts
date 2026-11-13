/**
 * Contrat commun aux prestataires de paiement. Chaque moyen de paiement en base
 * (PaymentMethod.provider) correspond à un adaptateur. Ajouter un prestataire
 * (Chargily, SATIM, Stripe…) = écrire un adaptateur, sans toucher au parcours.
 */
export interface PaymentContext {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  locale: string;
  /** Adresse de retour après paiement (page de confirmation). */
  returnUrl: string;
}

export type PaymentStart =
  /** Rien à payer en ligne (ex. paiement à la livraison). */
  | { kind: "offline" }
  /** Le client est envoyé sur la page du prestataire. */
  | { kind: "redirect"; url: string; providerRef: string };

export interface PaymentProvider {
  /** Identifiant enregistré dans PaymentMethod.provider. */
  id: string;
  /** Faux si les clés du prestataire ne sont pas configurées : le moyen est alors masqué. */
  isConfigured(): boolean;
  start(ctx: PaymentContext): Promise<PaymentStart>;
}
