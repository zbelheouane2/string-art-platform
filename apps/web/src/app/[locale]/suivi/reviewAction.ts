"use server";

import { db } from "@/lib/db";
import { displayName, reviewSchema } from "@/lib/reviewRules";
import { trackOrder } from "@/lib/tracking";

export type ReviewState = { status: "idle" | "sent" | "invalid" | "notAllowed" | "already" };

/** Avis d'un client sur une commande livrée (numéro + téléphone revérifiés). Publié après validation dans l'admin. */
export async function submitReviewAction(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const tracked = await trackOrder(String(form.get("number") ?? "").slice(0, 20), String(form.get("phone") ?? "").slice(0, 30));
  if (!tracked.ok || tracked.status !== "DELIVERED") return { status: "notAllowed" };
  const parsed = reviewSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { status: "invalid" };
  if (await db().customerReview.findFirst({ where: { orderNumber: tracked.number } })) return { status: "already" };
  const locale = String(form.get("locale") ?? "fr");
  await db().customerReview.create({
    data: { orderNumber: tracked.number, name: displayName(parsed.data.name), place: parsed.data.place || null, rating: parsed.data.rating, text: parsed.data.text, locale: ["fr", "en", "ar"].includes(locale) ? locale : "fr" },
  });
  await db().auditLog.create({ data: { actor: "system", action: "review.submitted", target: tracked.number } });
  return { status: "sent" };
}
