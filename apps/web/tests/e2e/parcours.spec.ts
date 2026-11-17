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
import pg from "pg";
import { expect, test, type Page } from "@playwright/test";

/** Crée un lot de codes neufs (un par test qui en consomme un). */
function freshCodes(count: number): string[] {
  const dir = mkdtempSync(path.join(tmpdir(), "codes-"));
  const out = path.join(dir, "codes.csv");
  const batch = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  execFileSync("npx", ["tsx", "scripts/create-codes.ts", "--count", String(count), "--batch", batch, "--out", out], { stdio: "ignore" });
  return readFileSync(out, "utf-8").trim().split("\n").slice(1);
}

/** Fichier WAV silencieux (mono, 8 kHz) pour tester le lecteur de musique. */
function silentWav(seconds: number): Buffer {
  const rate = 8000;
  const data = rate * seconds;
  const b = Buffer.alloc(44 + data);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + data, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(data, 40);
  b.fill(128, 44);
  return b;
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

  test("cadrage de la photo : visage centré, glisser, zoomer, recentrer, cadrage envoyé au calcul", async ({ page }) => {
    test.setTimeout(120_000);
    const [code] = freshCodes(1);
    await page.goto("/fr/activer");
    await page.getByLabel("Code à 8 caractères").fill(code);
    await page.getByRole("button", { name: "Valider mon code" }).click();
    await expect(page).toHaveURL(/\/fr\/creer$/);
    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../fixtures/portrait-test.jpg"));

    const view = page.getByRole("group", { name: /Cadrage de la photo/ });
    await expect(view).toBeVisible();
    await expect(page.getByText(/Visage trouvé et centré|Aucun visage détecté/)).toBeVisible({ timeout: 20_000 });
    const recenter = page.getByRole("button", { name: "Recentrer" });
    await expect(recenter).toBeDisabled();
    const zoom = page.getByRole("slider", { name: "Zoom" });
    const before = Number(await zoom.inputValue());

    await zoom.fill(String(Math.min(6, before + 1)));
    await expect.poll(async () => Number(await zoom.inputValue())).toBeGreaterThan(before + 0.5);
    await expect(recenter).toBeEnabled();
    const img = page.locator(".framer-img");
    const left0 = await img.evaluate((el) => parseFloat((el as HTMLElement).style.left));
    await view.scrollIntoViewIfNeeded();
    const b = (await view.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => img.evaluate((el) => parseFloat((el as HTMLElement).style.left))).not.toBe(left0);
    // La page ne déborde pas sur les côtés.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    await recenter.click();
    await expect(recenter).toBeDisabled();
    await expect.poll(async () => Number(await zoom.inputValue())).toBeCloseTo(before, 1);
    await page.getByRole("button", { name: "Zoomer", exact: true }).click();

    const chosen = await view.getAttribute("data-box");
    await page.getByRole("button", { name: "Calculer mon portrait" }).click();
    await expect(page.getByRole("heading", { name: "Votre portrait en fil" })).toBeVisible({ timeout: 90_000 });
    // Le moteur a calculé exactement le cadrage choisi.
    const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    const { rows } = await db.query(
      `select g.document->'crop_box' as box from "Generation" g join "ActivationCode" c on c.id = g."activationCodeId" where c.code = $1`,
      [code],
    );
    await db.end();
    expect(rows[0].box.join(",")).toBe(chosen);
    await axe(page);
  });

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

/** Le guide est interactif une fois la planche dessinée (évite de cliquer avant l'hydratation). */
async function hydrated(page: Page) {
  await expect(page.locator(".guide-canvas")).toHaveAttribute("width", /^[1-9]\d*$/);
}

async function openGuide(page: Page, url: string) {
  await page.goto(url);
  await hydrated(page);
}

test.describe("guide vocal (démonstration)", () => {
  test("avance, recule, saute à un fil et reprend où on s'était arrêté", async ({ page }) => {
    await openGuide(page, "/fr/guide/demo");
    await expect(page.getByText(/^Fil 1 sur 3158$/)).toBeVisible();
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect(page.getByText(/^Fil 3 sur 3158$/)).toBeVisible();
    await page.getByRole("button", { name: "Précédent" }).click();
    await expect(page.getByText(/^Fil 2 sur 3158$/)).toBeVisible();
    await page.getByLabel("Perdu ? Reprenez au fil n°").fill("125");
    await page.getByRole("button", { name: "Aller" }).click();
    await expect(page.getByText(/^Fil 125 sur 3158$/)).toBeVisible();
    // Repères lisibles de A1 à D60.
    await expect(page.locator(".guide-to")).toHaveText(/^[A-D]([1-9]|[1-5]\d|60)$/);

    await page.reload();
    await hydrated(page);
    await expect(page.getByText(/^Fil 125 sur 3158$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reprendre" })).toBeVisible();
  });

  test("lecture automatique : le fil suivant arrive tout seul", async ({ page }) => {
    await openGuide(page, "/fr/guide/demo");
    await page.evaluate(() => localStorage.setItem("dk-guide:demo", JSON.stringify({ step: 0, secondsPerStep: 3, voice: false })));
    await page.reload();
    await hydrated(page);
    await page.getByRole("button", { name: "Commencer" }).click();
    await expect(page.getByText(/^Fil 2 sur 3158$/)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: "Pause" }).click();
  });

  test("zoom sur la planche : la vue grossit, défile et le choix est gardé", async ({ page }) => {
    await openGuide(page, "/fr/guide/demo");
    const viewport = page.locator(".guide-viewport");
    const width = await viewport.evaluate((v) => v.clientWidth);
    await page.getByRole("button", { name: "Zoom × 2" }).click();
    await expect(page.getByRole("button", { name: "Zoom × 2" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => viewport.evaluate((v) => v.scrollWidth)).toBeGreaterThan(width * 1.8);
    // La page elle-même ne déborde pas.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole("button", { name: "Zoom × 2" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Zoom × 1", exact: true }).click();
    await expect.poll(() => viewport.evaluate((v) => v.scrollWidth - v.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("musique du téléphone : lecture, morceau suivant, volume, baisse pendant l'annonce", async ({ page }) => {
    // Voix simulée : chaque annonce dure 1,5 s.
    await page.addInitScript(() => {
      const synth = {
        speak(u: SpeechSynthesisUtterance) {
          setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 1500);
        },
        cancel() {},
        getVoices: () => [],
        addEventListener() {},
        removeEventListener() {},
      };
      Object.defineProperty(window, "speechSynthesis", { value: synth });
    });
    await openGuide(page, "/fr/guide/demo");
    await page.evaluate(() => localStorage.setItem("dk-guide:demo", JSON.stringify({ step: 0, secondsPerStep: 7, voice: true })));
    await page.reload();
    await hydrated(page);

    const files = ["Premier morceau.wav", "Deuxieme_morceau.wav"].map((name) => ({ name, mimeType: "audio/wav", buffer: silentWav(20) }));
    await page.locator("#guide-music-files").setInputFiles(files);
    await expect(page.getByText("Morceau 1 sur 2")).toBeVisible();
    await expect(page.getByText("Premier morceau", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Lecture" }).click();
    const audio = page.locator(".guide-music audio");
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => !a.paused)).toBe(true);
    await page.getByRole("button", { name: "Morceau suivant" }).click();
    await expect(page.getByText("Deuxieme morceau", { exact: true })).toBeVisible();

    await page.getByLabel(/Volume de la musique/).fill("0.8");
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.volume)).toBeCloseTo(0.8, 1);

    // Annonce d'un clou : la musique baisse, puis remonte.
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.volume)).toBeLessThan(0.3);
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.volume), { timeout: 5_000 }).toBeCloseTo(0.8, 1);

    await page.getByRole("button", { name: "Pause", exact: true }).last().click();
    await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
    await page.getByRole("button", { name: "Retirer la musique" }).click();
    await expect(page.locator(".guide-music button", { hasText: "Choisir des morceaux sur mon téléphone" })).toBeVisible();
  });

  for (const [locale, dir, label] of [
    ["fr", "ltr", "Fil 1 sur 3158"],
    ["en", "ltr", "Thread 1 of 3158"],
    ["ar", "rtl", "الخيط 1 من 3158"],
  ] as const) {
    test(`guide ${locale} : sens d'écriture, repères de gauche à droite, accessibilité, pas de défilement horizontal`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openGuide(page, `/${locale}/guide/demo`);
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
    // Téléphone : le récapitulatif est replié au-dessus du formulaire.
    const toggle = page.locator(".summary-toggle");
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole("button", { name: "Augmenter la quantité : Kit portrait 50 × 50 cm" }).click();
    await expect(page.locator(".order-total strong")).toHaveText("9 800 DA");
    // Aucun tarif saisi pour Alger : les frais comptent 0 DA (pas de « à confirmer »).
    await expect(page.locator(".order-lines > div").last().locator("dd")).toHaveText("0 DA");
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

  test("options support et bougie : choisies sur la fiche, ajoutées au total, à la commande et à la feuille", async ({ page }) => {
    await page.goto("/fr/kit");
    const box = page.locator("#acheter");
    await expect(box.locator(".accessory")).toHaveCount(2);
    await expect(box.getByText("+ 400 DA")).toBeVisible();
    await expect(box.getByText("+ 800 DA")).toBeVisible();
    const stand = box.getByRole("switch", { name: "Support chevalet en bois" });
    await stand.click();
    await expect(stand).toHaveAttribute("aria-checked", "true");
    // Le kit et l'option vont au panier, qui s'ouvre sur le côté.
    await box.getByRole("button", { name: "Ajouter au panier" }).click();
    const drawer = page.getByRole("dialog", { name: /Panier/ });
    await expect(drawer.locator(".cart-line")).toHaveCount(2);
    await expect(drawer.locator(".cart-total strong")).toHaveText("5 300 DA");
    await drawer.getByRole("link", { name: "Passer la commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commander$/);

    const summary = page.locator(".checkout-summary");
    await expect(summary.locator(".summary-item")).toHaveCount(2);
    await expect(page.locator(".order-total strong")).toHaveText("5 300 DA");
    if (await summary.locator(".summary-toggle").isVisible()) await summary.locator(".summary-toggle").click();
    await summary.getByRole("button", { name: /Bougie parfumée/ }).click();
    await expect(page.locator(".order-total strong")).toHaveText("6 100 DA");

    await page.getByLabel("Nom et prénom").fill("Client Options");
    await page.getByLabel("Téléphone mobile").fill("0555 66 77 88");
    await page.getByLabel("Wilaya").selectOption("31");
    await page.getByLabel("Commune", { exact: true }).selectOption("Oran");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    await expect(page.locator(".order-total strong")).toHaveText("6 100 DA");
    const number = page.url().split("/").pop();
    const items = execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", `SELECT p.slug || ':' || i."unitPriceMinor" FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId" JOIN "Product" p ON p.id = i."productId" WHERE o.number = '${number}' ORDER BY p.slug`]).toString().trim();
    expect(items.split("\n")).toEqual(["bougie-parfumee:80000", "kit-portrait-50:490000", "support-chevalet:40000"]);
  });

  for (const [locale, more, title, add] of [
    ["fr", "En savoir plus", "Posé, pas accroché", "Ajouter à ma commande"],
    ["ar", "اعرف المزيد", "ضعها حيث تشاء", "أضِف إلى طلبي"],
  ] as const) {
    test(`option : fenêtre de détail avec photo, texte et ajout (${locale})`, async ({ page }) => {
      await page.goto(`/${locale}/kit`);
      const box = page.locator("#acheter");
      await expect(box.locator(".accessory-thumb img")).toHaveCount(2);
      // Toute la zone texte (photo, nom, « En savoir plus ») ouvre la fenêtre.
      await expect(box.locator(".accessory-main").first()).toContainText(more);
      await box.locator(".accessory-name").first().click();
      const dialog = page.getByRole("dialog", { name: title });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("img")).toHaveJSProperty("complete", true);
      await axe(page);
      await dialog.getByRole("button", { name: add }).click();
      await expect(dialog).toBeHidden();
      await expect(box.getByRole("switch").first()).toHaveAttribute("aria-checked", "true");
      // Toute la zone de droite (prix compris) ajoute ou retire l'option.
      await box.locator(".accessory-price").first().click();
      await expect(box.getByRole("switch").first()).toHaveAttribute("aria-checked", "false");
      // Échap ferme la fenêtre.
      await box.locator(".accessory-thumb").nth(1).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    });
  }

  test("une option inconnue dans l'adresse est ignorée", async ({ page }) => {
    await page.goto("/fr/commander?options=inconnue");
    await expect(page.locator(".summary-item")).toHaveCount(1);
    await expect(page.locator(".order-total strong")).toHaveText("4 900 DA");
  });

  test("le bouton du site mène à la commande en passant par le panier", async ({ page }) => {
    await page.goto("/fr/kit");
    await page.locator("#acheter").getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Passer la commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commander$/);
  });

  test("panier : quantités, suppression, total, nombre d'articles sur l'icône, gardé d'une page à l'autre", async ({ page }) => {
    await page.goto("/fr/kit");
    await page.locator("#acheter").getByRole("button", { name: "Ajouter au panier" }).click();
    const drawer = page.getByRole("dialog", { name: /Panier/ });
    await drawer.getByRole("button", { name: "Augmenter la quantité : Kit portrait 50 × 50 cm" }).click();
    await expect(drawer.locator(".cart-total strong")).toHaveText("9 800 DA");
    await drawer.getByRole("button", { name: /Bougie parfumée/ }).click();
    await expect(drawer.locator(".cart-total strong")).toHaveText("10 600 DA");
    await expect(drawer.getByText("Frais de livraison calculés à l'étape suivante.", { exact: false })).toBeVisible();
    await axe(page);
    await drawer.locator(".cart-line").filter({ hasText: "Bougie parfumée" }).getByRole("button", { name: "Supprimer" }).click();
    await expect(drawer.locator(".cart-line")).toHaveCount(1);
    await drawer.getByRole("button", { name: "Fermer le panier" }).click();
    await page.goto("/fr");
    await expect(page.getByRole("button", { name: "Ouvrir le panier (2 articles)" })).toBeVisible();
    await page.goto("/fr/commander");
    await expect(page.locator(".order-total strong")).toHaveText("9 800 DA");
  });

  test("code promo : inconnu refusé, valide appliqué au total et enregistré avec la commande", async ({ page }) => {
    const code = `TEST${Date.now().toString(36).toUpperCase()}`;
    execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", `INSERT INTO "PromoCode" (id, code, kind, value, "updatedAt") VALUES ('${code.toLowerCase()}', '${code}', 'PERCENT', 10, now())`]);
    await page.goto("/fr/commander");
    const summary = page.locator(".checkout-summary");
    if (await summary.locator(".summary-toggle").isVisible()) await summary.locator(".summary-toggle").click();
    await summary.getByPlaceholder("Code promo").fill("NEXISTEPAS");
    await summary.getByRole("button", { name: "Valider" }).click();
    await expect(summary.getByText("Ce code promo n'existe pas.")).toBeVisible();
    await summary.getByPlaceholder("Code promo").fill(code.toLowerCase());
    await summary.getByRole("button", { name: "Valider" }).click();
    await expect(summary.getByText(`Code ${code} appliqué`)).toBeVisible();
    await expect(summary.locator(".line-discount dd")).toHaveText("− 490 DA");
    await expect(page.locator(".order-total strong")).toHaveText("4 410 DA");

    await page.getByLabel("Nom et prénom").fill("Client Promo");
    await page.getByLabel("Téléphone mobile").fill("0555 11 22 33");
    await page.getByLabel("Wilaya").selectOption("16");
    await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    const number = page.url().split("/").pop();
    const row = execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", `SELECT "promoCode" || ':' || "discountMinor" || ':' || "totalMinor" FROM "Order" WHERE number = '${number}'`]).toString().trim();
    expect(row).toBe(`${code}:49000:441000`);
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

test.describe("commande : confiance et erreurs", () => {
  test("engagements et vignette du kit sur la page de commande ; le premier champ en erreur reçoit le curseur", async ({ page }) => {
    await page.goto("/fr/commander");
    const toggle = page.locator(".summary-toggle");
    if (await toggle.isVisible()) {
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
    }
    await expect(page.locator(".summary-thumb img").first()).toBeVisible();
    const trust = page.locator(".order-form .reassure");
    await expect(trust).toContainText("Vous payez à la réception");
    await expect(page.locator(".order-total small")).toHaveText("À payer en espèces au livreur, à la réception.");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page.getByLabel("Nom et prénom")).toBeFocused();
    await expect(page.getByLabel("Nom et prénom")).toBeInViewport();
  });
});

test.describe("suivi et contact", () => {
  test("suivre ma commande : numéro + téléphone donnent l'état, sans donnée personnelle", async ({ page }) => {
    await page.goto("/fr/commander");
    await page.getByLabel("Nom et prénom").fill("Client Suivi");
    await page.getByLabel("Téléphone mobile").fill("0555 98 76 54");
    await page.getByLabel("Wilaya").selectOption("16");
    await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
    await page.getByLabel("Au bureau de livraison").check();
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    const number = page.url().split("/").pop()!;

    await page.goto("/fr/suivi");
    // Mauvais téléphone : rien n'est révélé.
    await page.getByLabel("Numéro de commande").fill(number.toLowerCase());
    await page.getByLabel("Téléphone utilisé pour la commande").fill("0555 00 00 00");
    await page.getByRole("button", { name: "Voir où en est ma commande" }).click();
    await expect(page.locator(".track-form .field-error")).toHaveText("Aucune commande ne correspond à ce numéro et ce téléphone.");

    await page.getByLabel("Téléphone utilisé pour la commande").fill("+213555987654");
    await page.getByRole("button", { name: "Voir où en est ma commande" }).click();
    await expect(page.locator(".track-result")).toContainText(number);
    await expect(page.locator('.track-steps li[aria-current="step"]')).toHaveText("Reçue");
    await expect(page.getByText("Client Suivi")).toHaveCount(0);
    await axe(page);
  });

  test("contact : le message est préparé pour WhatsApp, rien n'est envoyé au site", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = (url?: string | URL) => {
        (window as unknown as { __opened: string[] }).__opened.push(String(url));
        return null;
      };
    });
    await page.goto("/fr/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Une question ?");
    await page.getByRole("button", { name: "Envoyer sur WhatsApp" }).click();
    await expect(page.getByText("Écrivez votre message")).toBeVisible();
    await page.getByLabel("Votre nom").fill("Amina");
    await page.getByLabel("Votre message").fill("Le kit arrive quand ?");
    await page.getByRole("button", { name: "Envoyer sur WhatsApp" }).click();
    const opened = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
    expect(opened).toHaveLength(1);
    const url = new URL(opened[0]);
    expect(url.host).toBe("wa.me");
    expect(url.searchParams.get("text")).toBe("Votre nom : Amina\nLe kit arrive quand ?");
    await axe(page);
  });

  for (const locale of ["en", "ar"] as const) {
    test(`pages contact et suivi (${locale}) : accessibilité et largeur`, async ({ page }) => {
      for (const slug of ["contact", "suivi"]) {
        await page.goto(`/${locale}/${slug}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await axe(page);
      }
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
      // Téléphone : la flèche « suivante » fait glisser vers l'étape 2 (vers la gauche en FR, la droite en AR).
      const next = page.locator("#generateur [data-auto-next]");
      if (await next.isVisible()) {
        const track = page.locator("#generateur .auto-track");
        const before = await track.evaluate((el) => el.scrollLeft);
        await next.click();
        await expect.poll(() => track.evaluate((el) => el.scrollLeft)).not.toBe(before);
      }
      await expect(page.locator("#generateur")).toContainText(steps);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await axe(page);
    });
  }
});
