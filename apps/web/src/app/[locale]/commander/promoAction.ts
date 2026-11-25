"use server";

import { clientFingerprint } from "@/lib/clientIp";
import { db } from "@/lib/db";
import { findPromo } from "@/lib/promo";
import type { PromoRule } from "@/lib/promoRules";

export type PromoCheck = { ok: true; rule: PromoRule } | { ok: false; error: "promoInvalid" | "promoExpired" | "promoUnavailable" | "promoTooMany" };

/** Codes faux tolérés par appareil sur la fenêtre (empêche de deviner les codes promo). */
const MAX_MISSES = 10;
const WINDOW_MS = 15 * 60_000;

/** Vérifie un code promo pour l'afficher dans le récapitulatif (la commande le revérifie). */
export async function checkPromoAction(code: string): Promise<PromoCheck> {
  try {
    const fingerprint = await clientFingerprint();
    const since = new Date(Date.now() - WINDOW_MS);
    const misses = await db().auditLog.count({ where: { action: "promo.check.miss", target: fingerprint, createdAt: { gte: since } } });
    if (misses >= MAX_MISSES) return { ok: false, error: "promoTooMany" };
    const r = await findPromo(String(code).slice(0, 40));
    if (!r.ok && r.error === "promoInvalid") await db().auditLog.create({ data: { actor: "system", action: "promo.check.miss", target: fingerprint } });
    return r.ok ? { ok: true, rule: r.rule } : r;
  } catch {
    return { ok: false, error: "promoUnavailable" };
  }
}
