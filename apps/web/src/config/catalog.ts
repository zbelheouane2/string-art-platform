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
