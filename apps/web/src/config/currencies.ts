/**
 * Libellé court de chaque devise selon la langue (« 4 900 DA » plutôt que
 * « 4 900 DZD »). Ajouter une devise ici quand un nouveau marché ouvre.
 */
export const CURRENCY_LABELS: Record<string, { fr: string; en: string; ar: string; before?: boolean }> = {
  DZD: { fr: "DA", en: "DZD", ar: "د.ج", before: false },
  EUR: { fr: "€", en: "€", ar: "€", before: false },
};
