"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { audit, go, refreshSite, str } from "@/lib/admin/actionHelpers";
import { storeImage } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { displayName, reviewSchema } from "@/lib/reviewRules";

const PAGE = "/admin/avis";

export async function moderateReviewAction(form: FormData): Promise<void> {
  const me = await requireAdmin("reviews");
  const id = str(form, "id", 40);
  const op = str(form, "op", 10);
  const r = await db().customerReview.findUnique({ where: { id } });
  if (!r) go(PAGE, { erreur: "Avis introuvable." });
  if (op === "delete") await db().customerReview.delete({ where: { id } });
  else {
    const status = op === "approve" ? "APPROVED" : op === "reject" ? "REJECTED" : null;
    if (!status) go(PAGE, { erreur: "Action inconnue." });
    await db().customerReview.update({ where: { id }, data: { status: status!, moderatedBy: me.actor, moderatedAt: new Date() } });
  }
  await audit(me.actor, `review.${op}`, id);
  refreshSite();
  go(`${PAGE}?etat=${str(form, "etat", 10) || "PENDING"}`, { ok: op === "approve" ? "Avis publié sur l'accueil." : op === "reject" ? "Avis refusé (non publié)." : "Avis supprimé." });
}

/** Avis reçu par WhatsApp ou de vive voix, saisi avec l'accord du client : publié directement. */
export async function addReviewAction(form: FormData): Promise<void> {
  const me = await requireAdmin("reviews");
  const parsed = reviewSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) go(PAGE, { erreur: "Prénom, note (1 à 5) et avis de 10 caractères au moins." });
  let photoUrl: string | null = null;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    const r = await storeImage(file, me.actor);
    if ("error" in r) go(PAGE, { erreur: `Photo : ${r.error}` });
    photoUrl = (r as { url: string }).url;
  }
  const p = parsed.data!;
  await db().customerReview.create({
    data: { name: displayName(p.name), place: p.place || null, rating: p.rating, text: p.text, locale: str(form, "locale", 2) || "fr", photoUrl, status: "APPROVED", source: "admin", moderatedBy: me.actor, moderatedAt: new Date() },
  });
  await audit(me.actor, "review.added", displayName(p.name));
  refreshSite();
  go(`${PAGE}?etat=APPROVED`, { ok: "Avis ajouté et publié." });
}
