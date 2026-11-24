import { brand } from "@/config/brand";
import { site } from "@/config/site";
import type { ShopCatalog } from "@/lib/shopTypes";

/** Données structurées schema.org (résultats enrichis de Google). */
const abs = (p: string) => `${site.url}${p}`;

/** Fiche produit du kit : nom, photos, marque et prix réels (lus en base), jamais inventés. */
export function kitProductJsonLd(catalog: ShopCatalog, locale: string, description: string): object {
  const lang = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as "fr" | "en" | "ar";
  const { kit } = catalog;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: kit.names[lang],
    description,
    sku: kit.slug,
    brand: { "@type": "Brand", name: brand.name },
    image: ["/visuels/kit/bureau.webp", "/visuels/kit/boite-support.webp", "/visuels/kit/salon.webp"].map(abs),
    url: abs(`/${locale}/kit`),
    offers: {
      "@type": "Offer",
      url: abs(`/${locale}/kit`),
      price: (kit.price.amountMinor / 100).toFixed(2),
      priceCurrency: kit.price.currency,
      availability: catalog.orderingOpen ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: brand.name },
    },
  };
}

/** Identité du site (accueil) : nom, logo, contact et réseaux renseignés. */
export function organizationJsonLd(locale: string, contacts: { supportEmail: string; instagram: string; facebook: string; tiktok: string } = { supportEmail: brand.supportEmail, ...brand.social }): object {
  const sameAs = [contacts.instagram, contacts.facebook, contacts.tiktok].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: brand.name,
        url: abs(`/${locale}`),
        logo: abs(brand.logo.light),
        ...(contacts.supportEmail ? { email: contacts.supportEmail } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
      { "@type": "WebSite", name: brand.name, url: abs(`/${locale}`), inLanguage: locale },
    ],
  };
}
