"use server";

import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { audit, go } from "@/lib/admin/actionHelpers";
import { db } from "@/lib/db";
import { orderRowFromDb, postToSheet, sendOrderToSheet } from "@/lib/notify/orderSheet";
import { SHEET_SCRIPT_VERSION, SHEET_URL_RE } from "@/lib/notify/sheetScript";
import { getSetting, saveSetting } from "@/lib/settings";

const PAGE = "/admin/google-sheets";

export async function saveSheetAction(form: FormData): Promise<void> {
  const me = await requireAdmin("settings");
  const cur = await getSetting("googleSheet");
  const url = String(form.get("url") ?? "").trim();
  const secret = String(form.get("secret") ?? "").trim();
  if (url && !SHEET_URL_RE.test(url)) go(PAGE, { erreur: "L'adresse doit commencer par https://script.google.com/macros/s/… et finir par /exec." });
  if (secret.length < 16) go(PAGE, { erreur: "Mot secret trop court : générez-en un nouveau." });
  const enabled = form.get("enabled") === "on";
  if (enabled && !url) go(PAGE, { erreur: "Collez d'abord l'adresse de l'application Web Google." });
  const changed = url !== cur.url || secret !== cur.secret;
  await saveSetting(
    "googleSheet",
    { ...cur, url, secret, enabled, syncStatus: form.get("syncStatus") === "on", ...(changed ? { lastTestAt: null, lastTestOk: null } : {}) },
    me.actor,
  );
  await audit(me.actor, "settings.google_sheet", "googleSheet", { enabled, urlChanged: url !== cur.url, secretChanged: secret !== cur.secret });
  go(PAGE, { ok: enabled ? "Liaison enregistrée. Testez-la avec le bouton « Tester la liaison »." : "Réglages enregistrés (envoi désactivé)." });
}

export async function newSheetSecretAction(): Promise<void> {
  const me = await requireAdmin("settings");
  const cur = await getSetting("googleSheet");
  await saveSetting("googleSheet", { ...cur, secret: randomBytes(18).toString("base64url"), lastTestAt: null, lastTestOk: null }, me.actor);
  await audit(me.actor, "settings.google_sheet_secret", "googleSheet");
  go(PAGE, { ok: "Nouveau mot secret créé. Recopiez le script dans Google (étape 2), puis redéployez-le." });
}

export async function testSheetAction(): Promise<void> {
  const me = await requireAdmin("settings");
  const cur = await getSetting("googleSheet");
  if (!cur.url) go(PAGE, { erreur: "Collez d'abord l'adresse de l'application Web Google, puis enregistrez." });
  const r = await postToSheet(cur, { type: "test" });
  const ok = r?.ok === true;
  await saveSetting("googleSheet", { ...cur, lastTestAt: new Date().toISOString(), lastTestOk: ok }, me.actor);
  await audit(me.actor, "settings.google_sheet_test", "googleSheet", { ok });
  if (!ok) {
    go(PAGE, {
      erreur:
        r?.error === "secret"
          ? "Google a répondu, mais le mot secret ne correspond pas. Recopiez le script (étape 2) puis redéployez-le."
          : "Pas de réponse valable de Google. Vérifiez l'adresse et que l'accès est « Tout le monde » (étape 4).",
    });
  }
  if (r?.version !== SHEET_SCRIPT_VERSION) go(PAGE, { ok: "Liaison active, mais avec l'ancien script : recopiez le nouveau (étape 2) pour la colonne Statut." });
  go(PAGE, { ok: `Liaison réussie : la feuille « ${String(r?.sheet ?? "")} » est prête à recevoir les commandes.` });
}

/** Envoie les commandes jamais arrivées dans la feuille (50 au plus par clic, des plus anciennes aux plus récentes). */
export async function resendMissingAction(): Promise<void> {
  const me = await requireAdmin("settings");
  const cur = await getSetting("googleSheet");
  if (!cur.enabled || !cur.url) go(PAGE, { erreur: "Activez d'abord la liaison." });
  const missing = await db().order.findMany({ where: { sheetSentAt: null }, orderBy: { createdAt: "asc" }, take: 50, select: { number: true } });
  let sent = 0;
  for (const o of missing) {
    const r = await orderRowFromDb(o.number);
    if (r && (await sendOrderToSheet(r.row, r.status)) === "sent") sent++;
    else break;
  }
  await audit(me.actor, "settings.google_sheet_resend", "googleSheet", { sent, tried: missing.length });
  if (sent < missing.length) go(PAGE, { erreur: `${sent} commande(s) envoyée(s), puis Google n'a plus répondu. Réessayez dans un moment.` });
  go(PAGE, { ok: `${sent} commande(s) envoyée(s) dans la feuille.` });
}
