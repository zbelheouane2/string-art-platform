import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ar"],
  defaultLocale: "fr",
});

export type Locale = (typeof routing.locales)[number];

/** Langues écrites de droite à gauche. */
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function direction(locale: string): "rtl" | "ltr" {
  return (RTL_LOCALES as readonly string[]).includes(locale) ? "rtl" : "ltr";
}
