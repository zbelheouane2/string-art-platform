import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const [accept, expected] of [
  ["fr-DZ", "fr"],
  ["ar-DZ", "ar"],
  ["en-GB", "en"],
  ["de-DE", "fr"],
] as const) {
  test(`la racine suit la langue du navigateur (${accept} -> ${expected})`, async ({ browser }) => {
    const context = await browser.newContext({ locale: accept });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/${expected}$`));
    await context.close();
  });
}

for (const [locale, dir, title] of [
  ["fr", "ltr", "Votre photo, tissée fil à fil."],
  ["en", "ltr", "Your photo, woven thread by thread."],
  ["ar", "rtl", "صورتك، منسوجة خيطًا بخيط."],
] as const) {
  test(`accueil ${locale} : langue, sens d'écriture, titre`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", dir);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  });

  test(`accueil ${locale} : aucun défilement horizontal`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`accueil ${locale} : accessibilité (axe, WCAG A/AA)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("le sélecteur de langue garde la page", async ({ page }) => {
  await page.goto("/fr");
  await page.locator(".site-header").getByRole("link", { name: /العربية/ }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("le portrait se tisse jusqu'au bout", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr");
  await expect(page.locator(".plaque-status strong")).toHaveText(/1\s?913 sur 1\s?913/);
  await expect(page.getByRole("button", { name: "Revoir le tissage" })).toBeVisible();
});

test("la FAQ s'ouvre au clavier", async ({ page }) => {
  await page.goto("/fr");
  const summary = page.getByText("Faut-il savoir dessiner ?");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Aucun geste artistique")).toBeVisible();
});

test("santé : base et moteur", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ status: "ok", database: "ok", engine: { status: "ok" } });
});
