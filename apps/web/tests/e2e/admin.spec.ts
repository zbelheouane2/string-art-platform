import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Mot de passe de l'espace admin en développement (fichier .env, jamais en production). */
const PASSWORD = process.env.ADMIN_PASSWORD ?? "dev-admin-pass-123";

async function login(page: Page) {
  await page.goto("/admin/connexion");
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("espace admin", () => {
  test.skip(({ isMobile }) => isMobile, "un seul passage suffit (données partagées)");

  test("protégé par mot de passe, hors index, sans préfixe de langue", async ({ page, request }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toContain("/admin/connexion");
    expect((await request.get("/admin/livraison/zrexpress/tarifs.csv")).status()).toBe(401);
    await page.goto("/admin/connexion");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.locator("#login-error")).toHaveText("Mot de passe incorrect.");
    await login(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tableau de bord");
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/admin\/connexion$/);
  });

  test("codes d'activation : lot créé, fichier téléchargé, codes valides et utilisables", async ({ page, request }) => {
    expect((await request.get("/admin/codes/lot-x/codes.csv")).status()).toBe(401);
    await login(page);
    await page.goto("/admin/codes");
    const batch = `e2e-${Date.now()}`;
    await page.getByLabel("Nombre de codes").fill("abc");
    await page.getByRole("button", { name: "Créer les codes" }).click();
    await expect(page.locator(".a-flash-error")).toContainText("entre 1 et");
    await page.getByLabel("Nombre de codes").fill("5");
    await page.getByLabel(/Nom du lot/).fill(batch);
    await page.getByRole("button", { name: "Créer les codes" }).click();
    await expect(page.getByText(`5 codes créés dans le lot ${batch}.`)).toBeVisible();
    const row = page.locator("tr", { hasText: batch });
    await expect(row.locator("td").nth(1)).toHaveText("5");
    const csv = await page.request.get(`/admin/codes/${batch}/codes.csv`);
    expect(csv.status()).toBe(200);
    const codes = (await csv.text()).trim().split(/\r?\n/);
    expect(codes[0]).toBe("code");
    expect(codes.slice(1)).toHaveLength(5);
    for (const c of codes.slice(1)) expect(c).toMatch(/^[2-9A-HJKMNPQRTV-Z]{4}-[2-9A-HJKMNPQRTV-Z]{4}$/);
    // Un code du lot est reconnu sur la page d'activation.
    await page.goto("/fr/activer");
    await page.getByLabel(/code/i).first().fill(codes[1]);
    await page.getByRole("button", { name: /Continuer|Valider|Activer/ }).first().click();
    await expect(page).not.toHaveURL(/\/fr\/activer$/, { timeout: 10_000 });
  });

  test("prix : enregistrés tels quels, montant invalide refusé", async ({ page }) => {
    await login(page);
    await page.goto("/admin/prix");
    await expect(page.getByLabel("Kit portrait 50 × 50 cm")).toHaveValue("4900");
    await page.getByRole("button", { name: "Enregistrer les prix" }).click();
    await expect(page.getByRole("status")).toContainText("Prix enregistrés");
    await page.getByLabel("Bougie parfumée", { exact: true }).fill("abc");
    await page.getByRole("button", { name: "Enregistrer les prix" }).click();
    await expect(page.locator(".a-flash")).toContainText("Prix invalide");
    await expect(page.getByLabel("Bougie parfumée", { exact: true })).toHaveValue("800");
  });

  test("confirmation manuelle : WhatsApp prérempli, puis « Confirmée » en un clic", async ({ page }) => {
    const phone = `0770${String(Date.now()).slice(-6)}`;
    await page.goto("/fr/commander");
    await page.getByLabel("Nom et prénom").fill("Yasmine Confirm");
    await page.getByLabel("Téléphone mobile").fill(phone);
    await page.getByLabel("Wilaya", { exact: true }).selectOption("16");
    await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
    await page.getByLabel("Au bureau de livraison").check();
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    const number = page.url().split("/").pop()!;

    await login(page);
    await page.goto("/admin/commandes?etat=PENDING");
    const row = page.locator("tr", { hasText: number });
    await expect(row.locator(".a-status")).toHaveText("À confirmer");
    const wa = row.getByRole("link", { name: "Confirmer sur WhatsApp" });
    await expect(wa).toHaveAttribute("target", "_blank");
    const href = (await wa.getAttribute("href"))!;
    expect(href).toMatch(new RegExp(`^https://wa\\.me/213${phone.slice(1)}\\?text=`));
    const text = decodeURIComponent(href.split("text=")[1]);
    expect(text).toContain("Bonjour Yasmine,");
    expect(text).toContain(number);
    expect(text).toContain("Wilaya : Alger");
    expect(text).toMatch(/Total : [\d\s\u202f]+ DA/);

    await row.getByRole("button", { name: "Marquer confirmée" }).click();
    await expect(page.getByRole("status")).toHaveText(`Commande ${number} mise à jour.`);
    const done = page.locator("tr", { hasText: number });
    await expect(done.locator(".a-status")).toHaveText("Confirmée");
    await expect(done.getByRole("link", { name: "Confirmer sur WhatsApp" })).toHaveCount(0);
  });

  test("codes promo : création avec conditions, minimum vérifié à la commande, désactivation", async ({ page }) => {
    const code = `ADM${Date.now().toString(36).toUpperCase()}`;
    await login(page);
    await page.goto("/admin/promos");
    const create = page.locator("details", { hasText: "Créer un code" });
    if (!(await create.getAttribute("open"))) await create.locator("summary").click();
    await page.getByLabel("Code", { exact: true }).fill(code);
    await page.getByLabel("Type de remise").selectOption("FIXED");
    await page.getByLabel("Valeur (% ou DA)").fill("500");
    await page.getByLabel("Porte sur").selectOption("KIT");
    await page.getByLabel("Minimum d'articles (DA, facultatif)").fill("9000");
    await page.getByRole("button", { name: "Créer le code" }).click();
    await expect(page.getByRole("status")).toHaveText(`Code ${code} créé.`);
    const row = page.locator("tr", { hasText: code });
    await expect(row).toContainText("500 DA sur le kit seul");
    await expect(row).toContainText("Dès 9 000 DA d'articles");

    // Côté client : 1 kit (4 900 DA) n'atteint pas le minimum de 9 000 DA.
    await page.goto("/fr/commander");
    await page.getByPlaceholder("Code promo").fill(code);
    await page.getByRole("button", { name: "Valider", exact: true }).click();
    await expect(page.getByText("Valable à partir de 9 000 DA d'articles.")).toBeVisible();
    await expect(page.locator(".order-total strong")).toHaveText("4 900 DA");
    await page.getByRole("button", { name: "Augmenter la quantité : Kit portrait 50 × 50 cm" }).click();
    await expect(page.locator(".line-discount dd")).toHaveText("− 500 DA");
    await expect(page.locator(".order-total strong")).toHaveText("9 300 DA");

    await page.goto("/admin/promos");
    await page.locator("tr", { hasText: code }).getByRole("button", { name: "Désactiver" }).click();
    await expect(page.locator("tr", { hasText: code })).toContainText("Désactivé");
  });

  test("livraison : nouvelle société, tarifs importés avec aperçu, choix proposé au client", async ({ page }) => {
    const code = `co${Date.now().toString(36)}`;
    await login(page);
    await page.goto("/admin/livraison");
    await page.locator("summary", { hasText: "Ajouter une société" }).click();
    await page.getByLabel("Nom affiché").fill("Express Test");
    await page.getByLabel("Identifiant (minuscules, sans espace)").fill(code);
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/livraison/${code}`));
    await expect(page.getByRole("status")).toContainText("ajoutée (inactive)");

    // Import : aperçu des changements, puis validation.
    const dir = mkdtempSync(path.join(tmpdir(), "tarifs-"));
    const file = path.join(dir, "tarifs.csv");
    writeFileSync(file, "wilaya;domicile;bureau\n16 - Alger;350;200\nOran;650;\n");
    await page.locator("#rate-file").setInputFiles(file);
    await page.getByRole("button", { name: "Voir les changements" }).click();
    await expect(page.locator(".a-preview")).toContainText("3 changements");
    await page.getByRole("button", { name: "Valider l'import" }).click();
    await expect(page.getByRole("status")).toContainText("Import terminé : 3 montants enregistrés");
    await expect(page.getByLabel("Domicile, Alger", { exact: true })).toHaveValue("350");

    // Fichier faux : rien n'est importé.
    writeFileSync(file, "wilaya;domicile;bureau\nAtlantide;100;100\n");
    await page.locator("#rate-file").setInputFiles(file);
    await page.getByRole("button", { name: "Voir les changements" }).click();
    await expect(page.locator(".a-flash-error")).toContainText("wilaya inconnue « Atlantide »");

    // Activée : le client choisit sa société et voit son prix pour sa wilaya.
    await page.getByLabel("Société active").check();
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await expect(page.getByRole("status")).toHaveText("Société enregistrée.");
    try {
      await page.goto("/fr/commander");
      const choice = page.getByRole("radiogroup", { name: "Société de livraison" });
      await expect(choice).toBeVisible();
      await page.getByLabel("Wilaya", { exact: true }).selectOption("16");
      await expect(choice.locator("label", { hasText: "Express Test" })).toContainText("350 DA");
      await choice.getByLabel(/Express Test/).check();
      await page.getByLabel(/Au bureau de livraison/).check();
      await expect(page.locator(".order-total strong")).toHaveText("5 100 DA");
    } finally {
      // Société de test retirée entièrement (aucune commande ne la référence).
      const sql = [
        `DELETE FROM "DeliveryRate" WHERE "deliveryMethodId" IN (SELECT id FROM "DeliveryMethod" WHERE provider = '${code}')`,
        `DELETE FROM "DeliveryMethod" WHERE provider = '${code}'`,
        `DELETE FROM "Carrier" WHERE code = '${code}'`,
      ];
      for (const q of sql) execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", q]);
    }
  });
});

test.describe("espace admin sur téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "affichage téléphone");

  test("en-tête compact : rubriques sur une ligne qui défile, contenu jamais recouvert, commandes en fiches", async ({ page }) => {
    await login(page);
    for (const url of ["/admin", "/admin/commandes", "/admin/promos", "/admin/livraison"]) {
      await page.goto(url);
      const header = page.locator(".admin-top");
      // L'en-tête tient en deux lignes (logo + déconnexion, puis qui est connecté).
      expect((await header.boundingBox())!.height).toBeLessThan(130);
      // Les onglets restent sur une seule ligne, l'onglet ouvert est visible.
      const tabs = page.locator(".admin-nav a");
      const tops = await tabs.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      await expect(page.locator('.admin-nav a[aria-current="page"]')).toBeInViewport();
      // En défilant, l'en-tête part avec la page : il ne recouvre pas le contenu.
      await page.evaluate(() => window.scrollTo(0, 400));
      expect(await header.evaluate((h) => getComputedStyle(h).position)).toBe("static");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    }
    await page.goto("/admin/commandes");
    const row = page.locator(".a-table-cards tbody tr").first();
    if (await row.count()) {
      expect(await page.locator(".a-table-cards thead").evaluate((t) => getComputedStyle(t).display)).toBe("none");
      const box = (await row.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
  });
});
