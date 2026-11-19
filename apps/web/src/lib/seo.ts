import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { site, type IndexedPath } from "@/config/site";
import { routing } from "@/i18n/routing";

/** Adresse d'une page dans une langue : « /fr/kit », « /ar ». */
export const localizedPath = (locale: string, path: IndexedPath | string) => `/${locale}${path}`;

/** Versions linguistiques d'une page (hreflang), avec le français par défaut. */
export function languageAlternates(path: IndexedPath): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, localizedPath(l, path)]));
  languages["x-default"] = localizedPath(routing.defaultLocale, path);
  return languages;
}

/**
 * Métadonnées d'une page publique : titre, description, adresse canonique,
 * versions linguistiques et aperçu des liens (Open Graph, X/Twitter).
 */
export function pageMetadata({ locale, path, title, description }: { locale: string; path: IndexedPath; title: string; description?: string }): Metadata {
  const url = localizedPath(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      url,
      siteName: brand.name,
      title,
      description,
      locale: site.ogLocales[locale] ?? locale,
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => site.ogLocales[l] ?? l),
      images: [{ ...site.ogImage, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [site.ogImage.url] },
  };
}
