import { readFileSync } from "node:fs";
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
  ["fr", "ltr", "Le cadeau qu'on ne range pas au placard"],
  ["en", "ltr", "The gift that never ends up in a drawer"],
  ["ar", "rtl", "الهدية التي لا تُنسى في الخزانة"],
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
  await page.locator(".site-footer").getByRole("link", { name: /العربية/ }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("le portrait se tisse jusqu'au bout", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fr");
  // Nombre de fils lu dans le portrait de démonstration (change si on régénère le portrait).
  const { lines } = JSON.parse(readFileSync("public/demo/portrait-demo.json", "utf-8")) as { lines: number };
  const n = String(lines).replace(/\B(?=(\d{3})+$)/g, "\\s?");
  await expect(page.locator(".plaque-status strong")).toHaveText(new RegExp(`${n} sur ${n}`));
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

test("la page interne du design est masquée par défaut", async ({ request }) => {
  const res = await request.get("/fr/design");
  expect(res.status()).toBe(404);
});

test("les blocs apparaissent au défilement", async ({ page }) => {
  await page.goto("/fr");
  const card = page.locator("#cadeaux .gift-grid > li").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-visible/);
  await expect(card).toHaveCSS("opacity", "1");
});

test("avec « réduire les animations », tout est visible sans défiler", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/fr");
  await expect(page.locator("#faq .faq-list")).toHaveCSS("opacity", "1");
  await expect(page.locator(".marquee-track").first()).toHaveCSS("animation-name", "none");
  await context.close();
});

for (const [locale, dir] of [["fr", "ltr"], ["en", "ltr"], ["ar", "rtl"]] as const) {
  test(`page du kit ${locale} : titre, sens, accessibilité`, async ({ page }) => {
    // Mouvement réduit : axe mesure les couleurs finales, pas un fondu en cours.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}/kit`);
    await expect(page.locator("html")).toHaveAttribute("dir", dir);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#comment [role=tab]")).toHaveCount(6);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("le carrousel « Comment ça marche » : onglets, clavier, avance seul, pause", async ({ page }) => {
  await page.goto("/fr");
  const how = page.locator("#comment");
  const tabs = how.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  await how.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  // Avance seul après environ 5,5 s.
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true", { timeout: 9000 });
  await tabs.nth(4).click();
  await expect(how.getByRole("tabpanel")).toContainText("Suivez la voix");
  await expect(how.locator(".steps-slide").nth(4)).toHaveAttribute("data-active", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(5)).toBeFocused();
  await expect(how.getByRole("tabpanel")).toContainText("Accrochez-le");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await how.getByRole("button", { name: "Mettre le défilement en pause" }).click();
  await expect(how.locator(".steps")).toHaveAttribute("data-paused", "true");
  await expect(how.getByRole("button", { name: "Relancer le défilement" })).toHaveAttribute("aria-pressed", "true");
});

test("le carrousel ne défile pas seul avec « réduire les animations »", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/fr");
  const how = page.locator("#comment");
  await how.scrollIntoViewIfNeeded();
  await page.waitForTimeout(7000);
  await expect(how.getByRole("tab").nth(0)).toHaveAttribute("aria-selected", "true");
  await context.close();
});

test("la galerie produit glisse avec les flèches et les vignettes", async ({ page }) => {
  await page.goto("/fr/kit");
  const count = page.locator(".gallery-count");
  await expect(count).toHaveText("1 / 22");
  await page.getByRole("button", { name: "Visuel suivant" }).click();
  await expect(count).toHaveText("2 / 22");
  await page.locator(".gallery-thumbs button").nth(4).click();
  await expect(count).toHaveText("5 / 22");
  await page.getByRole("button", { name: "Visuel précédent" }).click();
  await expect(count).toHaveText("4 / 22");
});

test("le bouton « Comment ça marche ? » mène à la page du kit", async ({ page }) => {
  await page.goto("/fr");
  await page.locator("#hero-actions").getByRole("link", { name: "Comment ça marche ?" }).click();
  await expect(page).toHaveURL(/\/fr\/kit$/);
});

test("le plan de la planche montre 240 clous numérotés de 1 à 60 par secteur", async ({ page }) => {
  await page.goto("/fr");
  const plan = page.locator("svg.box-plan");
  // 240 clous + le disque central et son contour.
  await expect(plan.locator("circle")).toHaveCount(242);
  const nums = await plan.locator("g > text").allTextContents();
  expect(nums).toHaveLength(240);
  expect(nums.slice(0, 3)).toEqual(["1", "2", "3"]);
  expect(nums[59]).toBe("60");
  expect(nums[60]).toBe("1");
  expect(nums[239]).toBe("60");
});
