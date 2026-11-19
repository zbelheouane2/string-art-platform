import type { MetadataRoute } from "next";
import { INDEXED_PATHS, site } from "@/config/site";
import { routing } from "@/i18n/routing";
import { languageAlternates, localizedPath } from "@/lib/seo";

/** Plan du site : chaque page publique dans chaque langue, avec ses versions linguistiques. */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (p: string) => `${site.url}${p}`;
  return INDEXED_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([l, p]) => [l, abs(p)]));
    return routing.locales.map((locale) => ({
      url: abs(localizedPath(locale, path)),
      changeFrequency: path === "" || path === "/kit" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/kit" ? 0.9 : 0.5,
      alternates: { languages },
    }));
  });
}
