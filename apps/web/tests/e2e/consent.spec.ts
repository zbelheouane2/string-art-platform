import { expect, test, type Page } from "@playwright/test";

/**
 * Bandeau de consentement et chargement des outils de mesure. Ne tourne que si
 * le site a été construit avec des identifiants (ex. NEXT_PUBLIC_GA4_ID=G-TEST123,
 * NEXT_PUBLIC_META_PIXEL_ID=1234567890, NEXT_PUBLIC_TIKTOK_PIXEL_ID=CTEST1234567890)
 * et lancé avec ANALYTICS_E2E=1. Les scripts des outils sont interceptés : aucun
 * appel ne part vers Google, Meta ou TikTok pendant les tests.
 */
test.skip(!process.env.ANALYTICS_E2E, "site construit sans identifiants de mesure");

const TOOLS = /googletagmanager\.com|connect\.facebook\.net|analytics\.tiktok\.com/;

async function watchTools(page: Page): Promise<string[]> {
  const hits: string[] = [];
  await page.route(TOOLS, (route) => {
    hits.push(new URL(route.request().url()).hostname);
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  return hits;
}

test("rien n'est chargé avant l'accord ; refuser est mémorisé", async ({ page }) => {
  const hits = await watchTools(page);
  await page.goto("/fr");
  const banner = page.getByRole("region", { name: "Cookies de mesure" });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole("link", { name: "En savoir plus" })).toHaveAttribute("href", "/fr/confidentialite");
  await banner.getByRole("button", { name: "Refuser" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("region", { name: "Cookies de mesure" })).toBeHidden();
  expect(hits).toEqual([]);
});

test("accepter charge les trois outils ; le lien du pied de page rouvre le choix", async ({ page }) => {
  const hits = await watchTools(page);
  await page.goto("/fr/kit");
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect.poll(() => new Set(hits).size).toBe(3);
  await page.getByRole("contentinfo").getByRole("button", { name: "Cookies" }).click();
  await expect(page.getByRole("region", { name: "Cookies de mesure" })).toBeVisible();
});

test("bandeau en arabe, de droite à gauche, sans défilement horizontal", async ({ page }) => {
  await watchTools(page);
  await page.goto("/ar");
  const banner = page.getByRole("region", { name: "ملفات تعريف الارتباط للقياس" });
  await expect(banner.getByRole("button", { name: "أوافق" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("bandeau accessible (WCAG 2.1 AA)", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await watchTools(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr");
  await expect(page.locator(".consent")).toBeVisible();
  const results = await new AxeBuilder({ page }).include(".consent").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
