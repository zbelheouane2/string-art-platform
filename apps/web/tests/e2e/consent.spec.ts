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

test("pixel Meta : événements standards du parcours d'achat, achat en DZD compté une fois", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "un seul passage suffit (commande réelle en base)");
  // Faux fbevents.js : enregistre chaque appel fbq (gardé d'une page à l'autre).
  await page.route(TOOLS, (route) => {
    const body = route.request().url().includes("connect.facebook.net")
      ? `(function(){var f=window.fbq;function rec(a){var l=JSON.parse(sessionStorage.getItem("fb")||"[]");l.push(a);sessionStorage.setItem("fb",JSON.stringify(l));}
         (f.queue||[]).forEach(function(a){rec(Array.prototype.slice.call(a));});f.queue=[];f.callMethod=function(){rec(Array.prototype.slice.call(arguments));};})();`
      : "";
    return route.fulfill({ status: 200, contentType: "application/javascript", body });
  });
  type Call = [string, string, Record<string, unknown>?, Record<string, unknown>?];
  const calls = async () => (await page.evaluate(() => JSON.parse(sessionStorage.getItem("fb") || "[]"))) as Call[];
  const tracked = async (name: string) => (await calls()).filter((c) => c[0] === "track" && c[1] === name);

  await page.goto("/fr/kit");
  await page.getByRole("button", { name: "Accepter" }).click();
  await expect.poll(async () => (await calls()).some((c) => c[0] === "init" && /^\d+$/.test(c[1]))).toBe(true);
  await expect.poll(async () => (await tracked("PageView")).length).toBeGreaterThan(0);
  await expect.poll(async () => (await tracked("ViewContent")).length).toBe(1);
  const [view] = await tracked("ViewContent");
  expect(view[2]).toMatchObject({ currency: "DZD", content_type: "product" });

  await page.locator("#acheter").getByRole("button", { name: "Ajouter au panier" }).click();
  await expect.poll(async () => (await tracked("AddToCart")).length).toBe(1);
  expect((await tracked("AddToCart"))[0][2]).toMatchObject({ currency: "DZD", value: view[2]!.value });

  await page.getByRole("dialog").getByRole("link", { name: "Passer la commande" }).click();
  await expect(page).toHaveURL(/\/fr\/commander$/);
  await expect.poll(async () => (await tracked("InitiateCheckout")).length).toBe(1);

  await page.getByLabel("Nom et prénom").fill("Client Pixel");
  await page.getByLabel("Téléphone mobile").fill(`0771${String(Date.now()).slice(-6)}`);
  await page.getByLabel("Wilaya", { exact: true }).selectOption("16");
  await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
  await page.getByLabel("Au bureau de livraison").check();
  await page.getByRole("button", { name: "Valider ma commande" }).click();
  await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
  const number = page.url().split("/").pop()!;
  const total = Number((await page.locator(".order-total strong").innerText()).replace(/\D/g, ""));
  await expect.poll(async () => (await tracked("Purchase")).length).toBe(1);
  const [purchase] = await tracked("Purchase");
  expect(purchase[2]).toMatchObject({ currency: "DZD", value: total });
  expect(purchase[3]).toEqual({ eventID: number });
  // Aucune donnée personnelle dans les événements.
  expect(JSON.stringify(await calls())).not.toMatch(/Client Pixel|0771/);

  await page.reload();
  await expect.poll(async () => (await tracked("PageView")).length).toBeGreaterThan(2);
  expect((await tracked("Purchase")).length).toBe(1);
});
