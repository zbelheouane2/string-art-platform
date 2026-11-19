import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  ["livraison", { fr: "Livraison", en: "Delivery", ar: "التوصيل" }],
  ["retours", { fr: "Retours et échanges", en: "Returns and exchanges", ar: "الإرجاع والاستبدال" }],
  ["confidentialite", { fr: "Protection des données personnelles", en: "Personal data protection", ar: "حماية المعطيات الشخصية" }],
  ["conditions", { fr: "Conditions générales de vente", en: "Terms of sale", ar: "الشروط العامة للبيع" }],
] as const;

for (const [slug, titles] of PAGES) {
  for (const locale of ["fr", "en", "ar"] as const) {
    test(`page ${slug} (${locale}) : titre, pas de défilement horizontal, accessibilité`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(titles[locale]);
      await expect(page.locator(".info-section").first()).toBeVisible();
      // Aucun « {min} » ou autre valeur oubliée dans les textes.
      expect(await page.locator("main").innerText()).not.toMatch(/\{\w+\}/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
}

test("la page Données personnelles cite la loi 18-07 et les droits", async ({ page }) => {
  await page.goto("/fr/confidentialite");
  await expect(page.getByText(/loi n° 18-07 du 10 juin 2018/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos droits" })).toBeVisible();
  await expect(page.getByText(/droit d'accès/)).toBeVisible();
});

test("le pied de page mène aux quatre pages d'information", async ({ page }) => {
  await page.goto("/fr");
  const footer = page.locator(".site-footer");
  for (const [name, url] of [
    ["Livraison", /\/fr\/livraison$/],
    ["Retours et échanges", /\/fr\/retours$/],
    ["Données personnelles", /\/fr\/confidentialite$/],
    ["Conditions de vente", /\/fr\/conditions$/],
  ] as const) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", url);
  }
});

test("pied de page : WhatsApp et e-mail affichés, réseaux masqués tant qu'ils sont vides", async ({ page }) => {
  await page.goto("/fr");
  const footer = page.locator(".site-footer");
  await expect(footer.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/213771704033");
  await expect(footer.locator(".footer-social")).toHaveCount(0);
  await expect(footer.locator('a[href^="mailto:"]')).toHaveAttribute("href", "mailto:deekraart@gmail.com");
});

test("fiche du kit : engagements sous le bouton Commander", async ({ page }) => {
  await page.goto("/fr/kit");
  const box = page.locator(".reassure");
  await expect(box.getByRole("link", { name: /Livré en 2 à 5 jours ouvrables/ })).toHaveAttribute("href", "/fr/livraison");
  await expect(box.getByText("Vous payez à la réception, rien avant")).toBeVisible();
  await expect(box.getByRole("link", { name: /échangé sans frais/ })).toHaveAttribute("href", "/fr/retours");
  await expect(box.getByRole("link", { name: /0771 70 40 33/ })).toHaveAttribute("href", "https://wa.me/213771704033");
});
