import { CURRENCY_LABELS } from "@/config/currencies";

export interface Price {
  amountMinor: number;
  currency: string;
}

/**
 * Prix lisible : chiffres latins dans toutes les langues (comme le reste du
 * site), sans centimes quand le montant est rond, libellé de devise local.
 */
export function formatPrice(price: Price, locale: string): string {
  const amount = price.amountMinor / 100;
  const whole = Number.isInteger(amount);
  const tag = locale === "ar" ? "ar-u-nu-latn" : locale;
  const label = CURRENCY_LABELS[price.currency]?.[locale as "fr" | "en" | "ar"];
  if (!label) {
    return new Intl.NumberFormat(tag, { style: "currency", currency: price.currency, maximumFractionDigits: whole ? 0 : 2 }).format(amount);
  }
  const number = new Intl.NumberFormat(locale === "en" ? "en" : "fr", { maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2 }).format(amount);
  return locale === "en" && price.currency !== "EUR" ? `${label} ${number}` : `${number} ${label}`;
}
