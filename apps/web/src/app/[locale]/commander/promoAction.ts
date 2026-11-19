"use server";

import { findPromo } from "@/lib/promo";
import type { PromoRule } from "@/lib/promoRules";

export type PromoCheck = { ok: true; rule: PromoRule } | { ok: false; error: "promoInvalid" | "promoExpired" | "promoUnavailable" };

/** Vérifie un code promo pour l'afficher dans le récapitulatif (la commande le revérifie). */
export async function checkPromoAction(code: string): Promise<PromoCheck> {
  try {
    return await findPromo(String(code).slice(0, 40));
  } catch {
    return { ok: false, error: "promoUnavailable" };
  }
}
