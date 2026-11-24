"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { audit, go, refreshSite, str, texts3 } from "@/lib/admin/actionHelpers";
import { storeImage } from "@/lib/admin/media";
import { IMAGE_SLOTS } from "@/config/imageSlots";
import { db } from "@/lib/db";
import { getSetting, saveSetting } from "@/lib/settings";

const PAGE = "/admin/photos";

export async function replaceSlotAction(form: FormData): Promise<void> {
  const me = await requireAdmin("media");
  const slot = str(form, "slot", 60);
  if (!IMAGE_SLOTS.some((s) => s.slot === slot)) go(PAGE, { erreur: "Emplacement inconnu." });
  const images = { ...(await getSetting("images")) };
  if (form.get("reset") === "1") delete images[slot];
  else {
    const r = await storeImage(form.get("file"), me.actor);
    if ("error" in r) go(PAGE, { erreur: r.error });
    images[slot] = (r as { url: string }).url;
  }
  await saveSetting("images", images, me.actor);
  await audit(me.actor, form.get("reset") === "1" ? "image.reset" : "image.replaced", slot);
  refreshSite();
  go(PAGE, { ok: form.get("reset") === "1" ? "Photo d'origine rétablie." : "Photo remplacée. Elle s'affiche déjà sur le site." });
}

export async function addExampleAction(form: FormData): Promise<void> {
  const me = await requireAdmin("media");
  const labels = texts3(form, "label", 40);
  if (!labels.fr) go(PAGE, { erreur: "Donnez une légende en français (ex. « Mariage »)." });
  const photo = await storeImage(form.get("photo"), me.actor);
  if ("error" in photo) go(PAGE, { erreur: `Photo : ${photo.error}` });
  const thread = await storeImage(form.get("thread"), me.actor);
  if ("error" in thread) go(PAGE, { erreur: `Portrait en fil : ${thread.error}` });
  const last = await db().showcaseExample.aggregate({ _max: { position: true } });
  await db().showcaseExample.create({ data: { photoUrl: (photo as { url: string }).url, threadUrl: (thread as { url: string }).url, labels, position: (last._max.position ?? -1) + 1 } });
  await audit(me.actor, "example.added", labels.fr);
  refreshSite();
  go(PAGE, { ok: "Exemple ajouté à la fiche du kit." });
}

export async function updateExampleAction(form: FormData): Promise<void> {
  const me = await requireAdmin("media");
  const id = str(form, "id", 40);
  const op = str(form, "op", 10);
  const list = await db().showcaseExample.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) go(PAGE, { erreur: "Exemple introuvable." });
  if (op === "delete") await db().showcaseExample.delete({ where: { id } });
  else if (op === "toggle") await db().showcaseExample.update({ where: { id }, data: { active: !list[i].active } });
  else if (op === "save") {
    const labels = texts3(form, `label_${id}`, 40);
    if (!labels.fr) go(PAGE, { erreur: "La légende en français est obligatoire." });
    await db().showcaseExample.update({ where: { id }, data: { labels } });
  } else {
    const j = op === "up" ? i - 1 : i + 1;
    if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
    await db().$transaction(list.map((e, k) => db().showcaseExample.update({ where: { id: e.id }, data: { position: k } })));
  }
  await audit(me.actor, `example.${op}`, id);
  refreshSite();
  go(PAGE, { ok: "Exemples enregistrés." });
}
