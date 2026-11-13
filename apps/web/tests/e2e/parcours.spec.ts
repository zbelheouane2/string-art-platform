/**
 * Parcours complets : code → photo → portrait → guide vocal, et commande avec
 * paiement à la livraison. Nécessite la base (migrée + seed) et, pour le
 * calcul du portrait, le moteur (ENGINE_URL).
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Crée un lot de codes neufs (un par test qui en consomme un). */
function freshCodes(count: number): string[] {
  const dir = mkdtempSync(path.join(tmpdir(), "codes-"));
  const out = path.join(dir, "codes.csv");
  const batch = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  execFileSync("npx", ["tsx", "scripts/create-codes.ts", "--count", String(count), "--batch", batch, "--out", out], { stdio: "ignore" });
  return readFileSync(out, "utf-8").trim().split("\n").slice(1);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
}

test.describe("code d'activation", () => {
  test("une faute de frappe est signalée sans compter comme un essai", async ({ page }) => {
    const [code] = freshCodes(1);
    const typo = code.slice(0, 2) + (code[2] === "2" ? "3" : "2") + code.slice(3);
    await page.goto("/fr/activer");
    await page.getByLabel("Code à 8 caractères").fill(typo);
    await page.getByRole("button", { name: "Valider mon code" }).click();
    await expect(page.locator("#code-error")).toContainText("ne semble pas correct");
  });

  test("un code valide ouvre le studio, en minuscules et sans tiret", async ({ page }) => {
    const [code] = freshCodes(1);
    await page.goto("/fr/activer");
    await page.getByLabel("Code à 8 caractères").fill(code.replace("-", "").toLowerCase());
    await page.getByRole("button", { name: "Valider mon code" }).click();
    await expect(page).toHaveURL(/\/fr\/creer$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre photo devient un portrait");
  });

  test("le studio sans code renvoie vers la saisie du code", async ({ page }) => {
    await page.goto("/fr/creer");
    await expect(page).toHaveURL(/\/fr\/activer$/);
  });

  for (const locale of ["fr", "ar"] as const) {
    test(`page du code ${locale} : accessibilité`, async ({ page }) => {
      await page.goto(`/${locale}/activer`);
      await axe(page);
    });
  }
});

test.describe("portrait et guide", () => {
  test.skip(!!process.env.SKIP_ENGINE, "moteur indisponible");

  test("photo → portrait → validation → guide ; le guide est réservé à l'appareil du code", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const [code] = freshCodes(1);
    await page.goto("/fr/activer");
    await page.getByLabel("Code à 8 caractères").fill(code);
    await page.getByRole("button", { name: "Valider mon code" }).click();
    await expect(page).toHaveURL(/\/fr\/creer$/);

    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../fixtures/portrait-test.jpg"));
    await page.getByRole("button", { name: "Calculer mon portrait" }).click();
    await expect(page.getByRole("heading", { name: "Votre portrait en fil" })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/\d+ fils, environ \d+ m de fil/)).toBeVisible();

    await page.getByRole("button", { name: "Je valide ce portrait" }).click();
    await expect(page).toHaveURL(/\/fr\/guide\/[a-z0-9]+$/);
    await expect(page.getByText(/^Fil 1 sur \d+$/)).toBeVisible();
    const guideUrl = page.url();

    // Le code est désormais utilisé : le ressaisir rouvre directement le guide.
    await page.goto("/fr/activer");
    await page.getByLabel("Code à 8 caractères").fill(code);
    await page.getByRole("button", { name: "Valider mon code" }).click();
    await expect(page).toHaveURL(guideUrl);

    // Un autre appareil (sans le code) ne peut pas ouvrir ce guide.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto(guideUrl);
    await expect(otherPage).toHaveURL(/\/fr\/activer$/);
    await other.close();
  });
});

test.describe("guide vocal (démonstration)", () => {
  test("avance, recule, saute à un fil et reprend où on s'était arrêté", async ({ page }) => {
    await page.goto("/fr/guide/demo");
    await expect(page.getByText(/^Fil 1 sur 3158$/)).toBeVisible();
    await page.getByRole("button", { name: "Suivant" }).click();
    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText(/^Fil 3 sur 3158$/)).toBeVisible();
    await page.getByRole("button", { name: "Précédent" }).click();
    await expect(page.getByText(/^Fil 2 sur 3158$/)).toBeVisible();
    await page.getByLabel("Perdu ? Reprenez au fil n°").fill("125");
    await page.getByRole("button", { name: "Aller" }).click();
    await expect(page.getByText(/^Fil 125 sur 3158$/)).toBeVisible();
    // Repères lisibles de A1 à D60.
    await expect(page.locator(".guide-to")).toHaveText(/^[A-D]([1-9]|[1-5]\d|60)$/);

    await page.reload();
    await expect(page.getByText(/^Fil 125 sur 3158$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reprendre" })).toBeVisible();
  });

  test("lecture automatique : le fil suivant arrive tout seul", async ({ page }) => {
    await page.goto("/fr/guide/demo");
    await page.evaluate(() => localStorage.setItem("dk-guide:demo", JSON.stringify({ step: 0, secondsPerStep: 3, voice: false })));
    await page.reload();
    await page.getByRole("button", { name: "Commencer" }).click();
    await expect(page.getByText(/^Fil 2 sur 3158$/)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: "Pause" }).click();
  });

  for (const [locale, dir, label] of [
    ["fr", "ltr", "Fil 1 sur 3158"],
    ["en", "ltr", "Thread 1 of 3158"],
    ["ar", "rtl", "الخيط 1 من 3158"],
  ] as const) {
    test(`guide ${locale} : sens d'écriture, repères de gauche à droite, accessibilité, pas de défilement horizontal`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/guide/demo`);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.getByText(label, { exact: true })).toBeVisible();
      await expect(page.locator(".guide-move")).toHaveAttribute("dir", "ltr");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await axe(page);
    });
  }
});

test.describe("commande", () => {
  test("paiement à la livraison : erreurs claires puis commande enregistrée", async ({ page }) => {
    await page.goto("/fr/commander");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page.getByText("Vérifiez les champs signalés.")).toBeVisible();
    await expect(page.getByText("Indiquez votre nom et prénom.")).toBeVisible();

    await page.getByLabel("Nom et prénom").fill("Client Test");
    await page.getByLabel("Téléphone mobile").fill("+213 555 12 34 56");
    await page.getByLabel("Wilaya").selectOption("16");
    await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
    await page.getByLabel("Au bureau de livraison").check();
    await page.getByLabel("À domicile").check();
    await expect(page.locator("#address")).toHaveCount(0);
    await page.getByLabel("Au bureau de livraison").check();
    await page.getByLabel("Nombre de kits").selectOption("2");
    await expect(page.locator(".order-total strong")).toHaveText("9 800 DA");
    await page.getByRole("button", { name: "Valider ma commande" }).click();

    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Commande enregistrée");
    await expect(page.locator(".order-total strong")).toHaveText("9 800 DA");
    await expect(page.getByText("Vous payez en espèces au livreur")).toBeVisible();
    // Aucune donnée personnelle sur la page de confirmation.
    await expect(page.getByText("Client Test")).toHaveCount(0);
  });

  test("frais de livraison connus : ajoutés au total selon la wilaya et le mode", async ({ page }) => {
    const dir = mkdtempSync(path.join(tmpdir(), "tarifs-"));
    const file = path.join(dir, "tarifs.csv");
    writeFileSync(file, "wilaya;domicile;bureau\n09 - Blida;600;400\n");
    execFileSync("npx", ["tsx", "scripts/import-rates.ts", "--carrier", "zrexpress", "--file", file], { stdio: "ignore" });

    await page.goto("/fr/commander");
    await expect(page.getByText("Choisissez votre wilaya pour voir les frais de livraison.")).toBeVisible();
    await page.getByLabel("Wilaya").selectOption("09");
    await expect(page.getByText("Frais de livraison : 600 DA.")).toBeVisible();
    await expect(page.locator(".order-total strong")).toHaveText("5 500 DA");
    await page.getByLabel("Au bureau de livraison").check();
    await expect(page.locator(".order-total strong")).toHaveText("5 300 DA");

    await page.getByLabel("Nom et prénom").fill("Client Blida");
    await page.getByLabel("Téléphone mobile").fill("0661223344");
    await page.getByLabel("Commune", { exact: true }).selectOption("Boufarik");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    await expect(page.getByText("Total livraison comprise")).toBeVisible();
    await expect(page.locator(".order-total strong")).toHaveText("5 300 DA");
  });

  test("communes : la liste suit la wilaya, en arabe aussi, avec saisie libre en dernier recours", async ({ page }) => {
    await page.goto("/ar/commander");
    const commune = page.locator("#commune");
    await expect(commune).toBeDisabled();
    await page.locator("#wilaya").selectOption("68");
    await expect(commune.locator("option")).toHaveCount(1 + 23 + 1);
    await expect(commune.locator('option[value="Bou Saada"]')).toHaveText("بوسعادة");
    await commune.selectOption("__autre");
    await expect(page.locator("#communeOther")).toBeVisible();
    await page.locator("#wilaya").selectOption("16");
    await expect(commune).toHaveValue("");
    await expect(page.locator("#communeOther")).toHaveCount(0);
  });

  test("cadeau depuis l'étranger : acheteur + destinataire, envoyé avec la commande", async ({ page }) => {
    await page.goto("/fr/kit");
    await page.locator("#acheter").getByRole("link", { name: "Offrir un kit à un proche en Algérie" }).click();
    await expect(page).toHaveURL(/\/fr\/commander\?cadeau=1$/);
    await expect(page.getByLabel("C'est un cadeau pour un proche en Algérie")).toBeChecked();
    await expect(page.getByRole("group", { name: "Le destinataire en Algérie" })).toBeVisible();

    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page.getByText("Numéro attendu avec l'indicatif du pays")).toBeVisible();

    await page.locator("#buyerName").fill("Amina Diaspora");
    await page.locator("#buyerPhone").fill("+33 6 12 34 56 78");
    await page.locator("#fullName").fill("Fatima Destinataire");
    await page.locator("#phone").fill("0770 12 34 56");
    await page.locator("#wilaya").selectOption("25");
    await page.locator("#commune").selectOption("Constantine");
    await page.locator("#giftMessage").fill("Joyeux anniversaire maman");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    await expect(page.getByText("Votre proche paie en espèces au livreur")).toBeVisible();
  });

  test("offre numérique diaspora : présentée, paiement pas encore ouvert", async ({ page }) => {
    for (const [locale, title] of [["fr", "Le portrait en fil, 100 % numérique"], ["ar", "لوحة الخيط، رقمية بالكامل"]] as const) {
      await page.goto(`/${locale}/numerique`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.locator("main .btn-primary")).toBeDisabled();
      await axe(page);
    }
  });

  test("options : sans prix elles sont « bientôt » ; avec un prix elles s'ajoutent au total et à la feuille", async ({ page }) => {
    await page.goto("/fr/kit");
    const stand = page.locator("#acheter").getByRole("switch", { name: "Support chevalet en bois" });
    await expect(stand).toBeDisabled();
    await expect(page.locator("#acheter .accessory")).toHaveCount(2);
    await expect(page.locator("#acheter").getByText("Prix bientôt disponible").first()).toBeVisible();

    // Prix d'essai posé en base le temps du test (le vrai prix viendra du catalogue).
    const sql = (q: string) => execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", q]);
    const where = `"productId" = (SELECT id FROM "Product" WHERE slug = 'bougie-parfumee') AND "marketId" = (SELECT id FROM "Market" WHERE code = 'DZ')`;
    sql(`DELETE FROM "Price" WHERE ${where}; INSERT INTO "Price" (id, "productId", "marketId", "amountMinor", currency) SELECT 'e2e-bougie', (SELECT id FROM "Product" WHERE slug = 'bougie-parfumee'), (SELECT id FROM "Market" WHERE code = 'DZ'), 120000, 'DZD'`);
    try {
      await page.goto("/fr/commander?options=bougie-parfumee,inconnue");
      const candle = page.getByRole("switch", { name: "Bougie parfumée" });
      await expect(candle).toHaveAttribute("aria-checked", "true");
      await expect(page.getByRole("switch", { name: "Support chevalet en bois" })).toHaveCount(0);
      await expect(page.locator(".order-total strong")).toHaveText("6 100 DA");
      await candle.click();
      await expect(page.locator(".order-total strong")).toHaveText("4 900 DA");
      await candle.click();

      await page.getByLabel("Nom et prénom").fill("Client Options");
      await page.getByLabel("Téléphone mobile").fill("0555 66 77 88");
      await page.getByLabel("Wilaya").selectOption("31");
      await page.getByLabel("Commune", { exact: true }).selectOption("Oran");
      await page.getByRole("button", { name: "Valider ma commande" }).click();
      await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
      await expect(page.locator(".order-total strong")).toHaveText("6 100 DA");
      const number = page.url().split("/").pop();
      const items = sql(`SELECT p.slug || ':' || i."unitPriceMinor" FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId" JOIN "Product" p ON p.id = i."productId" WHERE o.number = '${number}' ORDER BY p.slug`).toString().trim();
      expect(items.split("\n")).toEqual(["bougie-parfumee:120000", "kit-portrait-50:490000"]);
    } finally {
      sql(`DELETE FROM "Price" WHERE ${where}`);
    }
  });

  test("le bouton du site mène à la commande", async ({ page }) => {
    await page.goto("/fr/kit");
    await page.locator("#acheter").getByRole("link", { name: "Commander" }).click();
    await expect(page).toHaveURL(/\/fr\/commander$/);
  });

  for (const locale of ["fr", "ar"] as const) {
    test(`formulaire ${locale} : accessibilité et largeur`, async ({ page }) => {
      await page.goto(`/${locale}/commander`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await axe(page);
    });
  }
});

test.describe("fiche du kit", () => {
  for (const [locale, facts, steps] of [
    ["fr", "Montage : 4 à 6 h environ, à votre rythme", "Saisissez votre code"],
    ["ar", "مدة الإنجاز: من 4 إلى 6 ساعات تقريبًا، على راحتك", "أدخل رمزك"],
  ] as const) {
    test(`repères sous le prix et générateur en 5 étapes (${locale})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/kit`);
      await expect(page.locator("#acheter .kit-facts li")).toHaveCount(4);
      await expect(page.locator("#acheter .kit-facts")).toContainText(facts);
      await expect(page.locator("#generateur .engine-card")).toHaveCount(5);
      // Carrousel : la flèche « suivante » fait glisser vers l'étape 2 (vers la gauche en FR, la droite en AR).
      const track = page.locator(".engine-track");
      const before = await track.evaluate((el) => el.scrollLeft);
      await page.locator(".engine-arrow").nth(1).click();
      await expect.poll(() => track.evaluate((el) => el.scrollLeft)).not.toBe(before);
      await expect(page.locator("#generateur")).toContainText(steps);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await axe(page);
    });
  }
});
