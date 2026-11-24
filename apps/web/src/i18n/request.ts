import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadMessages } from "@/lib/content";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  // Textes du fichier, remplacés par ceux modifiés dans l'admin (Textes du site).
  return { locale, messages: await loadMessages(locale) };
});
