import "server-only";
import { clientFingerprint } from "./clientIp";
import { db } from "./db";
import { normalizeOrderNumber } from "./orderNumber";
import { normalizeDzPhone, normalizeIntlPhone } from "./orderSchema";

/** Essais infructueux tolérés par appareil sur la fenêtre (anti-énumération). */
const MAX_MISSES = 10;
const WINDOW_MS = 15 * 60 * 1000;

export type TrackResult =
  | { ok: true; number: string; status: string; createdAt: string; totalMinor: number; currency: string }
  | { ok: false; error: "format" | "notFound" | "tooMany" };

/**
 * Suivi d'une commande : il faut le numéro ET le téléphone donné à la
 * commande (destinataire ou acheteur). Aucune donnée personnelle renvoyée.
 */
export async function trackOrder(numberInput: string, phoneInput: string): Promise<TrackResult> {
  const number = normalizeOrderNumber(numberInput);
  const phone = normalizeDzPhone(phoneInput) ?? normalizeIntlPhone(phoneInput);
  if (!number || !phone) return { ok: false, error: "format" };
  const fingerprint = await clientFingerprint();
  const since = new Date(Date.now() - WINDOW_MS);
  const misses = await db().auditLog.count({ where: { action: "order.track.miss", target: fingerprint, createdAt: { gte: since } } });
  if (misses >= MAX_MISSES) return { ok: false, error: "tooMany" };
  const order = await db().order.findUnique({
    where: { number },
    select: { number: true, status: true, createdAt: true, totalMinor: true, currency: true, shippingAddress: true, customer: { select: { phone: true } } },
  });
  const recipient = (order?.shippingAddress as { recipient?: { phone?: string } } | null)?.recipient?.phone;
  if (!order || (recipient !== phone && order.customer.phone !== phone)) {
    await db().auditLog.create({ data: { actor: "system", action: "order.track.miss", target: fingerprint } });
    return { ok: false, error: "notFound" };
  }
  return { ok: true, number: order.number, status: order.status, createdAt: order.createdAt.toISOString(), totalMinor: order.totalMinor, currency: order.currency };
}
