import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";
import { INDEXED_PATHS } from "../../src/config/site";
import { languageAlternates, pageMetadata } from "../../src/lib/seo";
import { kitProductJsonLd, organizationJsonLd } from "../../src/lib/structuredData";
import type { ShopCatalog } from "../../src/lib/shopTypes";

describe("SEO", () => {
  it("versions linguistiques d'une page, français par défaut", () => {
    expect(languageAlternates("/kit")).toEqual({ fr: "/fr/kit", en: "/en/kit", ar: "/ar/kit", "x-default": "/fr/kit" });
    expect(languageAlternates("")["x-default"]).toBe("/fr");
  });

  it("métadonnées : adresse canonique de la page et aperçu des liens", () => {
    const m = pageMetadata({ locale: "ar", path: "/kit", title: "T", description: "D" });
    expect(m.alternates?.canonical).toBe("/ar/kit");
    const og = m.openGraph as { url: string; locale: string; images: { url: string; width: number }[] };
    expect(og.url).toBe("/ar/kit");
    expect(og.locale).toBe("ar_DZ");
    expect(og.images[0]).toMatchObject({ url: "/og/deekra-1200x630.jpg", width: 1200 });
    expect((m.twitter as { card: string }).card).toBe("summary_large_image");
  });

  it("sitemap : chaque page publique dans les 3 langues, adresses absolues", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(INDEXED_PATHS.length * 3);
    expect(entries.every((e) => /^https?:\/\//.test(e.url))).toBe(true);
    const kit = entries.find((e) => e.url.endsWith("/en/kit"))!;
    expect(kit.alternates?.languages).toMatchObject({ fr: expect.stringMatching(/\/fr\/kit$/), ar: expect.stringMatching(/\/ar\/kit$/) });
    // Aucune page personnelle dans le plan du site.
    expect(entries.some((e) => /\/(commander|creer|guide|activer|suivi|admin)/.test(e.url))).toBe(false);
  });

  it("robots : admin, API et pages personnelles exclues, sitemap annoncé", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(["/admin", "/api/", "/*/commander", "/*/creer", "/*/guide"]));
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});

describe("données structurées", () => {
  const catalog: ShopCatalog = {
    kit: { slug: "kit-portrait-50", kind: "kit", names: { fr: "Kit", en: "Kit EN", ar: "طقم" }, price: { amountMinor: 490000, currency: "DZD" }, thumb: "/t.webp" },
    accessories: [],
    maxQuantity: 5,
    orderingOpen: true,
    provisional: true,
  };

  it("fiche produit avec le vrai prix et la disponibilité", () => {
    const p = kitProductJsonLd(catalog, "en", "desc") as { name: string; offers: { price: string; priceCurrency: string; availability: string } };
    expect(p.name).toBe("Kit EN");
    expect(p.offers).toMatchObject({ price: "4900.00", priceCurrency: "DZD", availability: "https://schema.org/InStock" });
    const closed = kitProductJsonLd({ ...catalog, orderingOpen: false }, "fr", "d") as { offers: { availability: string } };
    expect(closed.offers.availability).toBe("https://schema.org/PreOrder");
  });

  it("organisation sans réseau vide", () => {
    const o = organizationJsonLd("fr") as { "@graph": { sameAs?: string[] }[] };
    expect(o["@graph"][0].sameAs?.every(Boolean) ?? true).toBe(true);
  });
});

describe("mesure d'audience", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("aucun outil sans identifiant valide", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "pas-un-id");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("NEXT_PUBLIC_TIKTOK_PIXEL_ID", "<script>");
    const { analytics, analyticsEnabled } = await import("../../src/config/analytics");
    expect(analytics).toEqual({ ga4: "", metaPixel: "", tiktokPixel: "" });
    expect(analyticsEnabled).toBe(false);
  });

  it("identifiants lus depuis l'environnement", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-ABC123XYZ");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("NEXT_PUBLIC_TIKTOK_PIXEL_ID", "C1234567890ABCDEFGHI");
    const { analytics, analyticsEnabled } = await import("../../src/config/analytics");
    expect(analytics).toEqual({ ga4: "G-ABC123XYZ", metaPixel: "123456789012345", tiktokPixel: "C1234567890ABCDEFGHI" });
    expect(analyticsEnabled).toBe(true);
  });

  it("aucun envoi sans consentement (outils non chargés)", async () => {
    const { track } = await import("../../src/lib/analytics");
    expect(() => track("purchase", { valueMinor: 490000, currency: "DZD", orderId: "DK-ABC123" })).not.toThrow();
  });
});
