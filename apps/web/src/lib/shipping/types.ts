/**
 * Contrat commun aux sociétés de livraison (Yalidine, ZR Express, …).
 * Chaque mode de livraison en base (DeliveryMethod.provider) pointe vers un
 * adaptateur. Ajouter un transporteur = écrire un adaptateur et l'enregistrer
 * dans `index.ts`, puis ajouter ses modes de livraison en base : le formulaire
 * de commande ne change pas.
 */
export interface Parcel {
  orderNumber: string;
  recipient: { fullName: string; phone: string };
  destination: { wilayaCode: string; commune: string; address: string; toDesk: boolean };
  /** Montant à encaisser à la livraison (0 si déjà payé), en unité mineure. */
  codAmountMinor: number;
  currency: string;
  quantity: number;
}

export interface ShippingProvider {
  /** Identifiant enregistré dans DeliveryMethod.provider. */
  id: string;
  /** Faux tant que les clés du compte marchand ne sont pas configurées. */
  isConfigured(): boolean;
  /** Crée le colis chez le transporteur et renvoie le numéro de suivi. */
  createParcel(parcel: Parcel): Promise<{ trackingNumber: string }>;
  /** Frais de livraison réels, quand le transporteur les fournit. */
  quote?(destination: Parcel["destination"]): Promise<{ amountMinor: number; currency: string } | null>;
}
