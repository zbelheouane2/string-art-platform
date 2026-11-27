import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Espace admin étendu : comptes et rôles, contenu, stock, avis, Google Sheets, exports. */
const PASSWORD = process.env.ADMIN_PASSWORD ?? "dev-admin-pass-123";
const sql = (q: string) => execFileSync("psql", [process.env.DATABASE_URL!, "-qtAc", q]).toString().trim();

async function login(page: Page, login = "", password = PASSWORD) {
  await page.goto("/admin/connexion");
  if (login) await page.getByLabel("Identifiant").fill(login);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("espace admin étendu", () => {
  test.skip(({ isMobile }) => isMobile, "un seul passage suffit (données partagées)");
  test.describe.configure({ mode: "serial" });

  test("compte employé : accès limité aux commandes, stock, avis, annonce et FAQ", async ({ page, request }) => {
    const login_ = `emp${Date.now().toString(36)}`;
    await login(page);
    await page.goto("/admin/comptes");
    await page.getByLabel("Prénom et nom").fill("Karim Test");
    await page.getByLabel("Identifiant").fill(login_);
    await page.getByLabel(/^Mot de passe/).fill("employe-pass-123");
    await page.getByRole("button", { name: "Créer le compte" }).click();
    await expect(page.getByRole("status")).toContainText(`Compte « ${login_} » créé`);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/admin\/connexion$/);

    await page.getByLabel("Identifiant").fill(login_);
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.locator("#login-error")).toHaveText("Identifiant ou mot de passe incorrect.");

    await login(page, login_, "employe-pass-123");
    await expect(page.locator(".admin-who")).toContainText("Karim Test");
    const nav = await page.locator(".admin-nav a").allTextContents();
    expect(nav).toEqual(["Tableau de bord", "Commandes", "Stock", "Annonce", "FAQ", "Avis clients"]);
    // Rubriques réservées : renvoi au tableau de bord avec un message.
    for (const url of ["/admin/prix", "/admin/textes", "/admin/comptes", "/admin/google-sheets", "/admin/clients"]) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/admin\?erreur=/);
      await expect(page.locator(".a-flash-error")).toContainText("réservée à l'administrateur");
    }
    expect((await page.request.get("/admin/clients/export.xlsx")).status()).toBe(401);
    expect((await page.request.get("/admin/commandes/export.xlsx")).status()).toBe(401);
    expect((await request.get("/admin/clients/export.xlsx")).status()).toBe(401);
    await expect(page.getByRole("link", { name: "Exporter en Excel" })).toHaveCount(0);

    // Compte désactivé : la session ouverte est coupée tout de suite.
    sql(`UPDATE "AdminUser" SET active = false, "sessionVersion" = "sessionVersion" + 1 WHERE login = '${login_}'`);
    await page.goto("/admin/commandes");
    await expect(page).toHaveURL(/\/admin\/connexion$/);
    sql(`DELETE FROM "AdminUser" WHERE login = '${login_}'`);
  });

  test("textes, annonce et FAQ modifiés dans l'admin : visibles sur le site, texte d'origine rétabli", async ({ page }) => {
    await login(page);
    await page.goto("/admin/textes?rubrique=hero");
    const field = page.locator('[name="t_fr_hero.cta"]');
    await field.fill("Offrir ce portrait");
    await page.getByRole("button", { name: "Enregistrer les textes" }).click();
    await expect(page.getByRole("status")).toContainText("1 texte(s) enregistré(s)");
    await page.goto("/fr");
    await expect(page.locator("#hero-actions .btn-primary")).toHaveText("Offrir ce portrait");
    await page.goto("/ar");
    await expect(page.locator("#hero-actions .btn-primary")).not.toHaveText("Offrir ce portrait");

    // Variable retirée : refusé, rien n'est enregistré.
    await page.goto("/admin/textes?rubrique=hero");
    await page.locator('[name="t_fr_hero.progress"]').fill("Fil en cours");
    await page.getByRole("button", { name: "Enregistrer les textes" }).click();
    await expect(page.locator(".a-flash-error")).toContainText("{current}");

    // Champ vidé : texte d'origine.
    await page.goto("/admin/textes?rubrique=hero");
    await page.locator('[name="t_fr_hero.cta"]').fill("");
    await page.getByRole("button", { name: "Enregistrer les textes" }).click();
    await expect(page.getByRole("status")).toContainText("enregistré");
    await page.goto("/fr");
    await expect(page.locator("#hero-actions .btn-primary")).toHaveText("Offrir le kit");

    // Annonce permanente.
    await page.goto("/admin/annonce");
    await page.locator('[name="base_fr"]').fill("Livraison offerte cette semaine");
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Annonce enregistrée");
    await page.goto("/fr");
    await expect(page.locator(".announcement")).toHaveText("Livraison offerte cette semaine");
    await page.goto("/admin/annonce");
    await page.locator('[name="base_fr"]').fill("");
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Annonce enregistrée");

    // FAQ : question ajoutée et question d'origine masquée.
    await page.goto("/admin/faq");
    await page.locator('[name="nq_fr"]').fill("Livrez-vous le week-end ?");
    await page.locator('[name="na_fr"]').fill("Oui, selon la société de livraison.");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Question ajoutée.");
    await page.locator('input[name="hidden"][value="time"]').check();
    await page.getByRole("button", { name: "Enregistrer la FAQ" }).click();
    await expect(page.getByRole("status")).toContainText("FAQ enregistrée");
    await page.goto("/fr/kit");
    await expect(page.locator(".faq-list summary", { hasText: "Livrez-vous le week-end ?" })).toBeVisible();
    await expect(page.locator(".faq-list summary", { hasText: "Combien de temps faut-il ?" })).toHaveCount(0);
    sql(`DELETE FROM "Setting" WHERE key IN ('faq', 'announcement')`);
  });

  test("stock : kit en rupture = commandes fermées, rétabli ensuite", async ({ page }) => {
    await login(page);
    await page.goto("/admin/stock");
    const kit = page.locator("tr", { hasText: "Kit portrait" });
    await kit.getByLabel("En rupture").check();
    await page.getByRole("button", { name: "Enregistrer le stock" }).click();
    await expect(page.getByRole("status")).toContainText("Stock enregistré");
    try {
      await page.goto("/fr/commander");
      await expect(page.getByRole("button", { name: "Valider ma commande" })).toHaveCount(0);
    } finally {
      await page.goto("/admin/stock");
      await page.locator("tr", { hasText: "Kit portrait" }).getByLabel("En rupture").uncheck();
      await page.getByRole("button", { name: "Enregistrer le stock" }).click();
      await expect(page.getByRole("status")).toContainText("Stock enregistré");
    }
    await page.goto("/fr/commander");
    await expect(page.getByRole("button", { name: "Valider ma commande" })).toBeVisible();
  });

  test("avis : laissé après livraison, publié seulement après validation", async ({ page }) => {
    const phone = `0771${String(Date.now()).slice(-6)}`;
    await page.goto("/fr/commander");
    await page.getByLabel("Nom et prénom").fill("Nadia Avis");
    await page.getByLabel("Téléphone mobile").fill(phone);
    await page.getByLabel("Wilaya", { exact: true }).selectOption("16");
    await page.getByLabel("Commune", { exact: true }).selectOption("Bab Ezzouar");
    await page.getByLabel("Au bureau de livraison").check();
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await expect(page).toHaveURL(/\/fr\/commande\/DK-[0-9A-Z]{6}$/);
    const number = page.url().split("/").pop()!;
    sql(`UPDATE "Order" SET status = 'DELIVERED' WHERE number = '${number}'`);

    const text = `Magnifique portrait ${number}, merci !`;
    await page.goto("/fr/suivi");
    await page.getByLabel("Numéro de commande").fill(number);
    await page.getByLabel("Téléphone utilisé pour la commande").fill(phone);
    await page.getByRole("button", { name: "Voir où en est ma commande" }).click();
    await page.getByLabel("Prénom affiché").fill("Nadia Benali");
    await page.getByRole("textbox", { name: "Votre avis" }).fill(text);
    await page.getByRole("button", { name: "Envoyer mon avis" }).click();
    await expect(page.getByRole("status")).toContainText("publié après relecture");
    await page.goto("/fr");
    await expect(page.getByText(text)).toHaveCount(0);

    await login(page);
    await page.goto("/admin/avis");
    const card = page.locator(".a-reviews li", { hasText: text });
    await expect(card).toContainText("Nadia B.");
    await card.getByRole("button", { name: "Publier" }).click();
    await expect(page.getByRole("status")).toContainText("Avis publié");
    await page.goto("/fr");
    await expect(page.getByText(text)).toBeVisible();
    sql(`DELETE FROM "CustomerReview" WHERE "orderNumber" = '${number}'`);
  });

  test("photos : image vérifiée, remplacée puis rétablie", async ({ page }) => {
    await login(page);
    await page.goto("/admin/photos");
    const dir = mkdtempSync(path.join(tmpdir(), "photo-"));
    const fake = path.join(dir, "faux.png");
    writeFileSync(fake, "<svg xmlns='http://www.w3.org/2000/svg'/>");
    const slot = page.locator('li[id="home.final"]');
    await slot.locator('input[type="file"]').setInputFiles(fake);
    await slot.getByRole("button", { name: "Remplacer" }).click();
    await expect(page.locator(".a-flash-error")).toContainText("Format accepté");

    const real = path.join(dir, "vrai.webp");
    writeFileSync(real, execFileSync("cat", [path.join(process.cwd(), "public/visuels/chat-fil.webp")]));
    await page.locator('li[id="home.final"] input[type="file"]').setInputFiles(real);
    await page.locator('li[id="home.final"]').getByRole("button", { name: "Remplacer" }).click();
    await expect(page.getByRole("status")).toContainText("Photo remplacée");
    await page.goto("/fr");
    const src = await page.locator("img.final-img").getAttribute("src");
    expect(src).toMatch(/^\/media\/[a-z0-9]+$/);
    const img = await page.request.get(src!);
    expect(img.headers()["content-type"]).toBe("image/webp");

    await page.goto("/admin/photos");
    await page.locator('li[id="home.final"]').getByRole("button", { name: "Rétablir l'originale" }).click();
    await page.goto("/fr");
    await expect(page.locator("img.final-img")).toHaveAttribute("src", "/visuels/dame-fil.webp");
  });

  test("Google Sheets, contacts, référencement et exports Excel", async ({ page }) => {
    await login(page);
    await page.goto("/admin/google-sheets");
    await expect(page.getByRole("heading", { name: "Désactivée" })).toBeVisible();
    await expect(page.locator(".a-code pre")).toContainText("const SECRET =");
    await page.getByLabel("Adresse de l'application Web Google").fill("https://exemple.com/exec");
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(page.locator(".a-flash-error")).toContainText("script.google.com");

    await page.goto("/admin/contacts");
    await page.getByLabel("Numéro WhatsApp").fill("0661 22 33 44");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status")).toContainText("Coordonnées enregistrées");
    await page.goto("/fr/contact");
    await expect(page.locator(".contact-wa")).toHaveAttribute("href", /wa\.me\/213661223344/);
    sql(`DELETE FROM "Setting" WHERE key = 'contacts'`);

    await page.goto("/admin/referencement");
    await page.locator('[name="title_/kit_fr"]').fill("Kit portrait en fil – DeeKra");
    await page.getByRole("button", { name: "Enregistrer le référencement" }).click();
    await expect(page.getByRole("status")).toContainText("Référencement enregistré");
    await page.goto("/fr/kit");
    await expect(page).toHaveTitle("Kit portrait en fil – DeeKra");
    sql(`DELETE FROM "Setting" WHERE key = 'seo'`);

    for (const url of ["/admin/commandes/export.xlsx", "/admin/clients/export.xlsx"]) {
      const res = await page.request.get(url);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("spreadsheetml");
      expect((await res.body()).subarray(0, 2).toString()).toBe("PK");
    }
    await page.goto("/admin/journal");
    await expect(page.locator("td", { hasText: "Export des clients" }).first()).toBeVisible();
  });
});
