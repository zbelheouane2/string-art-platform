/**
 * Adresse publique du site et pages indexées. L'adresse se règle par
 * NEXT_PUBLIC_SITE_URL (ex. https://deekra.dz) : elle sert aux liens absolus
 * des aperçus WhatsApp/Facebook, au sitemap et aux balises canoniques.
 */
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");

export const site = {
  url: raw || "http://localhost:3000",
  /** Image d'aperçu des liens (1200 × 630). */
  ogImage: { url: "/og/deekra-1200x630.jpg", width: 1200, height: 630 },
  /** Langue et pays annoncés à Facebook (og:locale). */
  ogLocales: { fr: "fr_DZ", en: "en_US", ar: "ar_DZ" } as Record<string, string>,
} as const;

/**
 * Pages publiques proposées aux moteurs de recherche (sans le préfixe de
 * langue). Les pages de commande, de code, de portrait et de guide ne le sont pas.
 */
export const INDEXED_PATHS = ["", "/kit", "/numerique", "/contact", "/livraison", "/retours", "/confidentialite", "/conditions"] as const;
export type IndexedPath = (typeof INDEXED_PATHS)[number];
