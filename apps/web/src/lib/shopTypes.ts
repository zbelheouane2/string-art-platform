import type { Price } from "./price";

/** Article vendable affiché dans le panier et le récapitulatif (données publiques, sans secret). */
export interface ShopItem {
  slug: string;
  kind: "kit" | "accessory";
  names: { fr: string; en: string; ar: string };
  price: Price;
  /** Vignette carrée. */
  thumb: string;
  /** Option : clé d'icône du catalogue (fenêtre de détail). */
  icon?: "stand" | "candle";
}

export interface ShopCatalog {
  kit: ShopItem;
  accessories: ShopItem[];
  maxQuantity: number;
  orderingOpen: boolean;
  provisional: boolean;
}

/** Contenu du panier : slug → quantité (le kit et chaque option). */
export type CartLines = Record<string, number>;

/** « slug:quantité » séparés par des virgules, format envoyé au serveur avec la commande. */
export function encodeLines(lines: CartLines): string {
  return Object.entries(lines)
    .filter(([, q]) => q > 0)
    .map(([s, q]) => `${s}:${q}`)
    .join(",");
}
