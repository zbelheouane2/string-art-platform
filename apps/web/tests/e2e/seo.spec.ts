import { expect, test } from "@playwright/test";

test("aperçu des liens, adresse canonique et versions linguistiques", async ({ page }) => {
  await page.goto("/ar/kit");
  const og = (p: string) => page.locator(`meta[property="og:${p}"]`).first().getAttribute("content");
  expect(await og("image")).toMatch(/^https?:\/\/.+\/og\/deekra-1200x630\.jpg$/);
  expect(await og("url")).toMatch(/\/ar\/kit$/);
  expect(await og("locale")).toBe("ar_DZ");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar\/kit$/);
  for (const l of ["fr", "en", "ar", "x-default"]) await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveCount(1);
  const image = await page.request.get("/og/deekra-1200x630.jpg");
  expect(image.ok()).toBe(true);
  expect(Number(image.headers()["content-length"] ?? (await image.body()).length)).toBeLessThan(300_000);
});

test("fiche produit schema.org avec le prix réel", async ({ page }) => {
  await page.goto("/fr/kit");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const product = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "Product");
  expect(product.offers.priceCurrency).toBeTruthy();
  expect(Number(product.offers.price)).toBeGreaterThan(0);
});

test("pages personnelles non indexées", async ({ page }) => {
  await page.goto("/fr/activer");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("robots.txt et sitemap.xml", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<url>/g)).toHaveLength(24);
  expect(sitemap).not.toContain("/commander");
});
