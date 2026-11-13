import type { Price } from "@/lib/price";

/**
 * Offre affichée sur le site. Prix de lancement provisoire validé par le
 * propriétaire (4 900 DA) en attendant les coûts de fabrication : il est
 * marqué « provisoire » à l'écran. La commande en ligne n'est pas encore
 * ouverte : le bouton d'achat reste inactif tant que `orderingOpen` vaut false.
 * Les prix viendront ensuite de la base (table Price), par marché.
 */
export const kitOffer: { slug: string; price: Price | null; provisional: boolean; orderingOpen: boolean } = {
  slug: "kit-portrait-50",
  price: { amountMinor: 490000, currency: "DZD" },
  provisional: true,
  orderingOpen: false,
};
