/**
 * Règles des codes promo, sans accès à la base (testables, partagées par le
 * récapitulatif côté navigateur et la commande côté serveur).
 */
export interface PromoRule {
  code: string;
  kind: "PERCENT" | "FIXED";
  value: number;
  currency: string | null;
}

/** Saisie normalisée : majuscules, sans espaces ; null si le format est impossible. */
export function normalizePromo(input: string): string | null {
  const code = input.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(code) ? code : null;
}

/** Remise (unité mineure) sur le sous-total des articles, jamais plus que ce sous-total. */
export function promoDiscount(rule: PromoRule, subtotalMinor: number, currency: string): number {
  if (subtotalMinor <= 0) return 0;
  if (rule.kind === "PERCENT") {
    const pct = Math.min(90, Math.max(0, rule.value));
    // Arrondi à l'unité principale (dinar entier, centime pour l'euro).
    const unit = currency === "DZD" ? 100 : 1;
    return Math.min(subtotalMinor, Math.round((subtotalMinor * pct) / 100 / unit) * unit);
  }
  if (rule.currency && rule.currency !== currency) return 0;
  return Math.min(subtotalMinor, Math.max(0, rule.value));
}
