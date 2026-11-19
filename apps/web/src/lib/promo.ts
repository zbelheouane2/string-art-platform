import "server-only";
import { db } from "./db";
import { normalizePromo, type PromoRule } from "./promoRules";

export type PromoLookup =
  | { ok: true; rule: PromoRule; maxUsesPerPhone: number | null }
  | { ok: false; error: "promoInvalid" | "promoExpired" };

/** Cherche un code utilisable maintenant (actif, dans ses dates, sous son plafond d'utilisations). */
export async function findPromo(input: string, now = new Date()): Promise<PromoLookup> {
  const code = normalizePromo(input);
  if (!code) return { ok: false, error: "promoInvalid" };
  const p = await db().promoCode.findUnique({ where: { code } });
  if (!p || !p.active) return { ok: false, error: "promoInvalid" };
  if ((p.startsAt && p.startsAt > now) || (p.endsAt && p.endsAt < now) || (p.maxUses !== null && p.uses >= p.maxUses)) {
    return { ok: false, error: "promoExpired" };
  }
  return {
    ok: true,
    rule: { code: p.code, kind: p.kind, scope: p.scope, value: p.value, currency: p.currency, minOrderMinor: p.minOrderMinor },
    maxUsesPerPhone: p.maxUsesPerPhone,
  };
}

/** Nombre de commandes déjà passées avec ce code par ce numéro (client ou acheteur). */
export async function promoUsesByPhone(code: string, phone: string): Promise<number> {
  return db().order.count({ where: { promoCode: code, status: { not: "CANCELLED" }, customer: { phone } } });
}
