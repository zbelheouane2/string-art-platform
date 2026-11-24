"use server";

import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth";
import { audit, go, refreshSite, str, texts3 } from "@/lib/admin/actionHelpers";
import { originalMessages } from "@/lib/content";
import { CONTENT_SECTIONS, LOCALES, checkEditedText, flattenMessages } from "@/lib/contentTools";
import { db } from "@/lib/db";
import { getSetting, saveSetting, type Announcement, type Contacts, type FaqSettings, type SeoOverrides } from "@/lib/settings";
import { INDEXED_PATHS } from "@/config/site";

/* ---------------- Annonce ---------------- */

const ANN = "/admin/annonce";
const dateOrNull = (v: string, end = false) => (v ? new Date(`${v}T${end ? "23:59:59" : "00:00:00"}+01:00`).toISOString() : null);

export async function saveAnnouncementAction(form: FormData): Promise<void> {
  const me = await requireAdmin("announcement");
  const cur = await getSetting("announcement");
  const next: Announcement = { ...cur, base: texts3(form, "base"), hidden: form.get("hidden") === "on" };
  await saveSetting("announcement", next, me.actor);
  await audit(me.actor, "announcement.saved", "base", { hidden: next.hidden });
  refreshSite();
  go(ANN, { ok: "Annonce enregistrée. Elle s'affiche déjà sur le site." });
}

export async function addScheduledAction(form: FormData): Promise<void> {
  const me = await requireAdmin("announcement");
  const cur = await getSetting("announcement");
  const texts = texts3(form, "s");
  const label = str(form, "label", 60);
  const startsAt = dateOrNull(str(form, "startsAt", 10));
  const endsAt = dateOrNull(str(form, "endsAt", 10), true);
  if (!label) go(ANN, { erreur: "Donnez un nom à ce message (ex. « Aïd el-Fitr »)." });
  if (!texts.fr && !texts.ar && !texts.en) go(ANN, { erreur: "Écrivez le message dans au moins une langue." });
  if (startsAt && endsAt && endsAt < startsAt) go(ANN, { erreur: "La date de fin est avant la date de début." });
  if (cur.scheduled.length >= 30) go(ANN, { erreur: "30 messages programmés au plus : supprimez les anciens." });
  const item = { id: randomBytes(6).toString("hex"), label, texts, startsAt, endsAt, active: true };
  await saveSetting("announcement", { ...cur, scheduled: [...cur.scheduled, item] }, me.actor);
  await audit(me.actor, "announcement.scheduled", label);
  refreshSite();
  go(ANN, { ok: `Message « ${label} » programmé.` });
}

export async function toggleScheduledAction(form: FormData): Promise<void> {
  const me = await requireAdmin("announcement");
  const cur = await getSetting("announcement");
  const id = str(form, "id", 20);
  const del = form.get("delete") === "1";
  const scheduled = del ? cur.scheduled.filter((s) => s.id !== id) : cur.scheduled.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
  await saveSetting("announcement", { ...cur, scheduled }, me.actor);
  await audit(me.actor, del ? "announcement.deleted" : "announcement.toggled", id);
  refreshSite();
  go(ANN, { ok: del ? "Message supprimé." : "Message mis à jour." });
}

/* ---------------- Textes du site ---------------- */

/** Enregistre les textes d'une rubrique : champ vide ou identique à l'original = texte d'origine. */
async function saveTexts(form: FormData, ns: string, back: string, actor: string): Promise<{ changed: number }> {
  let changed = 0;
  for (const locale of LOCALES) {
    const original = flattenMessages(await originalMessages(locale));
    const current = new Map((await db().contentOverride.findMany({ where: { locale, key: { startsWith: `${ns}.` } } })).map((o) => [o.key, o.value]));
    for (const [key, raw] of form.entries()) {
      const prefix = `t_${locale}_`;
      if (!key.startsWith(prefix)) continue;
      const k = key.slice(prefix.length);
      if (!(k === ns || k.startsWith(`${ns}.`)) || !(k in original)) continue;
      const value = String(raw).replace(/\r\n/g, "\n").trim();
      if (value === "" || value === original[k]) {
        if (current.has(k)) {
          await db().contentOverride.delete({ where: { locale_key: { locale, key: k } } });
          changed++;
        }
        continue;
      }
      if (value === current.get(k)) continue;
      const err = checkEditedText(original[k], value);
      if (err) go(back, { erreur: `${k} (${locale}) : ${err}` });
      await db().contentOverride.upsert({ where: { locale_key: { locale, key: k } }, update: { value, updatedBy: actor }, create: { locale, key: k, value, updatedBy: actor } });
      changed++;
    }
  }
  return { changed };
}

export async function saveTextsAction(form: FormData): Promise<void> {
  const me = await requireAdmin("content");
  const ns = str(form, "ns", 40);
  if (!CONTENT_SECTIONS.some((s) => s.ns === ns)) go("/admin/textes", { erreur: "Rubrique inconnue." });
  const back = `/admin/textes?rubrique=${ns}`;
  const { changed } = await saveTexts(form, ns, back, me.actor);
  await audit(me.actor, "content.saved", ns, { changed });
  refreshSite();
  go(back, { ok: changed ? `${changed} texte(s) enregistré(s). Le site est déjà à jour.` : "Aucun changement." });
}

/* ---------------- FAQ ---------------- */

const FAQ = "/admin/faq";

export async function saveFaqTextsAction(form: FormData): Promise<void> {
  const me = await requireAdmin("faq");
  const { changed } = await saveTexts(form, "faq", FAQ, me.actor);
  const cur = await getSetting("faq");
  const hidden = form.getAll("hidden").map(String).slice(0, 20);
  const extra = cur.extra.map((e) => ({ ...e, q: texts3(form, `xq_${e.id}`), a: texts3(form, `xa_${e.id}`, 1500) }));
  await saveSetting("faq", { hidden, extra }, me.actor);
  await audit(me.actor, "faq.saved", "faq", { changed, hidden: hidden.length });
  refreshSite();
  go(FAQ, { ok: "FAQ enregistrée. Le site est déjà à jour." });
}

export async function addFaqAction(form: FormData): Promise<void> {
  const me = await requireAdmin("faq");
  const cur = await getSetting("faq");
  const q = texts3(form, "nq");
  const a = texts3(form, "na", 1500);
  if (!q.fr || !a.fr) go(FAQ, { erreur: "Écrivez au moins la question et la réponse en français." });
  if (cur.extra.length >= 30) go(FAQ, { erreur: "30 questions ajoutées au plus." });
  const next: FaqSettings = { ...cur, extra: [...cur.extra, { id: randomBytes(5).toString("hex"), q, a }] };
  await saveSetting("faq", next, me.actor);
  await audit(me.actor, "faq.added", q.fr.slice(0, 60));
  refreshSite();
  go(FAQ, { ok: "Question ajoutée." });
}

export async function moveFaqAction(form: FormData): Promise<void> {
  const me = await requireAdmin("faq");
  const cur = await getSetting("faq");
  const id = str(form, "id", 20);
  const op = str(form, "op", 10);
  const list = [...cur.extra];
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) go(FAQ, { erreur: "Question introuvable." });
  if (op === "delete") list.splice(i, 1);
  else {
    const j = op === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
  }
  await saveSetting("faq", { ...cur, extra: list }, me.actor);
  await audit(me.actor, `faq.${op}`, id);
  refreshSite();
  go(FAQ, { ok: op === "delete" ? "Question supprimée." : "Ordre enregistré." });
}

/* ---------------- Contacts et réseaux ---------------- */

export async function saveContactsAction(form: FormData): Promise<void> {
  const me = await requireAdmin("contacts");
  const back = "/admin/contacts";
  const whatsapp = str(form, "whatsapp", 30).replace(/\D/g, "");
  const c: Contacts = {
    whatsapp: whatsapp.startsWith("0") && whatsapp.length === 10 ? `213${whatsapp.slice(1)}` : whatsapp,
    supportEmail: str(form, "supportEmail", 120),
    instagram: str(form, "instagram", 300),
    facebook: str(form, "facebook", 300),
    tiktok: str(form, "tiktok", 300),
    anpdp: str(form, "anpdp", 80),
  };
  if (c.whatsapp && !/^\d{8,15}$/.test(c.whatsapp)) go(back, { erreur: "Numéro WhatsApp invalide (ex. 0771 70 40 33 ou 213771704033)." });
  if (c.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.supportEmail)) go(back, { erreur: "Adresse e-mail invalide." });
  for (const k of ["instagram", "facebook", "tiktok"] as const) if (c[k] && !/^https:\/\/[^\s"'<>]+$/.test(c[k])) go(back, { erreur: `Lien ${k} : il doit commencer par https://` });
  await saveSetting("contacts", c, me.actor);
  await audit(me.actor, "contacts.saved", "contacts");
  refreshSite();
  go(back, { ok: "Coordonnées enregistrées. Le site affiche déjà les nouvelles." });
}

/* ---------------- Référencement ---------------- */

export async function saveSeoAction(form: FormData): Promise<void> {
  const me = await requireAdmin("seo");
  const seo: SeoOverrides = {};
  for (const path of INDEXED_PATHS) {
    const key = path || "/";
    for (const locale of LOCALES) {
      const title = str(form, `title_${key}_${locale}`, 70);
      const description = str(form, `desc_${key}_${locale}`, 170);
      if (title || description) (seo[key] ??= {})[locale] = { title, description };
    }
  }
  await saveSetting("seo", seo, me.actor);
  await audit(me.actor, "seo.saved", "seo");
  refreshSite();
  go("/admin/referencement", { ok: "Référencement enregistré. Google le verra à son prochain passage." });
}
