import "server-only";
import { wilayaName } from "@/config/wilayas";
import { db } from "@/lib/db";
import { getSetting, type GoogleSheetSettings } from "@/lib/settings";
import { sheetSafe } from "./sheetScript";

/**
 * Envoi des commandes vers la Google Sheet du propriétaire, via un script
 * Google Apps Script publié en « application Web » (docs/commandes-google-sheet.md).
 * La liaison se règle dans l'admin (Réglages → Google Sheets) ; à défaut, les
 * variables ORDER_SHEET_URL / ORDER_SHEET_SECRET servent encore.
 * Un échec n'empêche jamais la commande : elle reste en base et l'échec est journalisé.
 */
export interface OrderRow {
  number: string;
  createdAt: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  delivery: string;
  payment: string;
  quantity: number;
  /** Options ajoutées (ex. « Support chevalet en bois ; Bougie parfumée »), vide sinon. */
  options: string;
  /** Code promo appliqué (vide sinon) et remise accordée (unité principale). */
  promo: string;
  discount: number;
  /** null : frais à confirmer par téléphone. */
  deliveryFee: number | null;
  total: number;
  currency: string;
  note: string;
  locale: string;
  /** Cadeau offert depuis l'étranger : coordonnées de l'acheteur (vides sinon). */
  gift: "oui" | "non";
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  giftMessage: string;
}

export type SheetResult = "sent" | "disabled" | "failed";

export function orderRow(input: Omit<OrderRow, "wilaya"> & { wilayaCode: string }): OrderRow {
  const { wilayaCode, ...rest } = input;
  // Textes saisis par le client neutralisés ici aussi : protège même une feuille dont le script n'est pas à jour.
  const safe = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, typeof v === "string" && k !== "phone" && k !== "buyerPhone" ? sheetSafe(v) : v]),
  ) as typeof rest;
  return { ...safe, wilaya: `${wilayaCode} - ${wilayaName(wilayaCode, "fr") ?? ""}` };
}

/** Envoie un message au script ; renvoie la réponse JSON du script, ou null. */
export async function postToSheet(cfg: Pick<GoogleSheetSettings, "url" | "secret">, body: object, timeoutMs = 8000): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: cfg.secret, ...body }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return text.includes('"ok":true') ? { ok: true } : null;
    }
  } catch {
    return null;
  }
}

export async function sendOrderToSheet(row: OrderRow, status?: string): Promise<SheetResult> {
  const cfg = await getSetting("googleSheet");
  if (!cfg.enabled || !cfg.url) return "disabled";
  const r = await postToSheet(cfg, { type: "order", order: row, ...(status ? { status } : {}) });
  if (r?.ok === true) {
    await db().order.update({ where: { number: row.number }, data: { sheetSentAt: new Date() } }).catch(() => undefined);
    return "sent";
  }
  return "failed";
}

const STATUS_FR: Record<string, string> = {
  PENDING: "À confirmer",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};

/** Met à jour la colonne « Statut » de la feuille (si l'option est activée). Jamais bloquant. */
export async function syncOrderStatusToSheet(number: string, status: string): Promise<SheetResult> {
  const cfg = await getSetting("googleSheet");
  if (!cfg.enabled || !cfg.url || !cfg.syncStatus) return "disabled";
  const r = await postToSheet(cfg, { type: "status", number, status: STATUS_FR[status] ?? status }, 5000);
  return r?.ok === true ? "sent" : "failed";
}

type Address = { recipient?: { fullName?: string; phone?: string }; wilaya?: string; commune?: string; note?: string; gift?: { message?: string } | null };

/** Reconstruit la ligne d'une commande enregistrée (renvoi des commandes non envoyées). */
export async function orderRowFromDb(number: string): Promise<{ row: OrderRow; status: string } | null> {
  const o = await db().order.findUnique({
    where: { number },
    include: { customer: true, deliveryMethod: true, items: { include: { product: true } }, payments: { include: { paymentMethod: true } } },
  });
  if (!o) return null;
  const a = o.shippingAddress as Address;
  const kit = o.items.find((i) => i.product.kind === "KIT");
  const extras = o.items.filter((i) => i.product.kind === "ACCESSORY");
  const names = (p: { names: unknown }) => (p.names as { fr?: string }).fr ?? "";
  const gift = !!a.gift;
  return {
    status: STATUS_FR[o.status] ?? o.status,
    row: orderRow({
      number: o.number,
      createdAt: o.createdAt.toISOString(),
      fullName: a.recipient?.fullName ?? o.customer.fullName,
      phone: a.recipient?.phone ?? o.customer.phone ?? "",
      wilayaCode: a.wilaya ?? "",
      commune: a.commune ?? "",
      delivery: o.deliveryMethod?.code ?? "",
      payment: o.payments[0]?.paymentMethod.code ?? "",
      quantity: kit?.quantity ?? 0,
      options: extras.map((e) => (e.quantity > 1 ? `${names(e.product)} ×${e.quantity}` : names(e.product))).join(" ; "),
      promo: o.promoCode ?? "",
      discount: o.discountMinor / 100,
      deliveryFee: o.deliveryFeeMinor === null ? null : o.deliveryFeeMinor / 100,
      total: o.totalMinor / 100,
      currency: o.currency,
      note: a.note ?? "",
      locale: o.customer.locale,
      gift: gift ? "oui" : "non",
      buyerName: gift ? o.customer.fullName : "",
      buyerPhone: gift ? (o.customer.phone ?? "") : "",
      buyerEmail: gift ? (o.customer.email ?? "") : "",
      giftMessage: a.gift?.message ?? "",
    }),
  };
}
