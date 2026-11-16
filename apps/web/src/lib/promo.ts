import "server-only";
import { db } from "./db";
import { normalizePromo, type PromoRule } from "./promoRules";

export type PromoLookup = { ok: true; rule: PromoRule } | { ok: false; error: "promoInvalid" | "promoExpired" };

/** Cherche un code utilisable maintenant (actif, dans ses dates, sous son plafond d'utilisations). */
export async function findPromo(input: string, now = new Date()): Promise<PromoLookup> {
  const code = normalizePromo(input);
  if (!code) return { ok: false, error: "promoInvalid" };
  const p = await db().promoCode.findUnique({ where: { code } });
  if (!p || !p.active) return { ok: false, error: "promoInvalid" };
  if ((p.startsAt && p.startsAt > now) || (p.endsAt && p.endsAt < now) || (p.maxUses !== null && p.uses >= p.maxUses)) {
    return { ok: false, error: "promoExpired" };
  }
  return { ok: true, rule: { code: p.code, kind: p.kind, value: p.value, currency: p.currency } };
}
