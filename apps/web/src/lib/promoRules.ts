/**
 * Règles des codes promo, sans accès à la base (testables, partagées par le
 * récapitulatif côté navigateur et la commande côté serveur).
 *
 * Portée : KIT (le kit seul), ORDER (tous les articles), SHIPPING (la livraison).
 * Type : PERCENT (pourcentage) ou FIXED (montant en unité mineure).
 */
export interface PromoRule {
  code: string;
  kind: "PERCENT" | "FIXED";
  scope: "KIT" | "ORDER" | "SHIPPING";
  value: number;
  currency: string | null;
  /** Montant minimal des articles (unité mineure), null : aucun. */
  minOrderMinor: number | null;
}

/** Montants de la commande sur lesquels une remise peut porter (unité mineure). */
export interface PromoBasket {
  kitMinor: number;
  itemsMinor: number;
  /** null : frais pas encore connus (wilaya non choisie ou tarif absent). */
  feeMinor: number | null;
}

/** Saisie normalisée : majuscules, sans espaces ; null si le format est impossible. */
export function normalizePromo(input: string): string | null {
  const code = input.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(code) ? code : null;
}

export function promoMinimumMet(rule: PromoRule, basket: PromoBasket): boolean {
  return rule.minOrderMinor === null || basket.itemsMinor >= rule.minOrderMinor;
}

/** Remise (unité mineure), jamais plus que le montant sur lequel elle porte. */
export function promoDiscount(rule: PromoRule, basket: PromoBasket, currency: string): number {
  if (!promoMinimumMet(rule, basket)) return 0;
  const base = rule.scope === "KIT" ? basket.kitMinor : rule.scope === "ORDER" ? basket.itemsMinor : (basket.feeMinor ?? 0);
  if (base <= 0) return 0;
  if (rule.kind === "PERCENT") {
    // Articles : 90 % au plus (évite une commande gratuite par erreur) ; livraison : jusqu'à 100 % (offerte).
    const pct = Math.min(rule.scope === "SHIPPING" ? 100 : 90, Math.max(0, rule.value));
    // Arrondi à l'unité principale (dinar entier ; centime pour les autres devises).
    const unit = currency === "DZD" ? 100 : 1;
    return Math.min(base, Math.round((base * pct) / 100 / unit) * unit);
  }
  if (rule.currency && rule.currency !== currency) return 0;
  return Math.min(base, Math.max(0, rule.value));
}
