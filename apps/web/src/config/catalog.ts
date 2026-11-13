import type { Price } from "@/lib/price";

/**
 * Offre affichée sur le site. Prix de lancement provisoire validé par le
 * propriétaire (4 900 DA) en attendant les coûts de fabrication : il est
 * marqué « provisoire » à l'écran. `orderingOpen` ouvre la page de commande
 * (paiement à la livraison). Ce prix sert aussi à remplir la table Price
 * (prisma/seed.ts) : la commande, elle, lit toujours le prix en base.
 */
export const kitOffer: { slug: string; price: Price | null; provisional: boolean; orderingOpen: boolean } = {
  slug: "kit-portrait-50",
  price: { amountMinor: 490000, currency: "DZD" },
  provisional: true,
  orderingOpen: process.env.NEXT_PUBLIC_ORDERING_OPEN !== "false",
};

/**
 * Options proposées avec le kit (interrupteur sur la fiche et dans la commande).
 * `price: null` = prix pas encore fixé par le propriétaire : l'option est
 * affichée « bientôt » et ne peut pas être choisie. Même règle que le kit : ce
 * prix remplit la table Price (seed), la commande relit le prix en base.
 */
export interface Accessory {
  slug: string;
  icon: "stand" | "candle";
  names: { fr: string; en: string; ar: string };
  price: Price | null;
}

export const accessories: readonly Accessory[] = [
  {
    slug: "support-chevalet",
    icon: "stand",
    names: { fr: "Support chevalet en bois", en: "Wooden display stand", ar: "حامل خشبي للعرض" },
    price: null,
  },
  {
    slug: "bougie-parfumee",
    icon: "candle",
    names: { fr: "Bougie parfumée", en: "Scented candle", ar: "شمعة معطّرة" },
    price: null,
  },
];
