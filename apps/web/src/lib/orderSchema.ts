import { z } from "zod";
import { OTHER_COMMUNE, isCommuneOf } from "@/config/communes";
import { commerce } from "@/config/commerce";
import { WILAYAS } from "@/config/wilayas";

/**
 * Numéro de mobile algérien : 05, 06 ou 07 suivi de 8 chiffres, avec ou sans
 * indicatif +213 / 00213. Normalisé en 0XXXXXXXXX.
 */
export function normalizeDzPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, "");
  const m = /^(?:\+213|00213|0)([567]\d{8})$/.exec(digits);
  return m ? `0${m[1]}` : null;
}

/**
 * Numéro international (acheteur à l'étranger qui offre un kit) : indicatif
 * pays obligatoire (+33…, 0033…), 8 à 15 chiffres. Normalisé en +XXXXXXXX.
 */
export function normalizeIntlPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, "").replace(/^00/, "+");
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

const optionalText = (max: number, message: string) => z.string().trim().max(max, message).optional().default("");

/**
 * Validation partagée par le formulaire (navigateur) et le serveur. Messages = clés de traduction.
 * Pas d'adresse complète (choix du propriétaire, protection des données) : wilaya
 * et commune suffisent, le livreur appelle le client pour le lieu exact.
 */
export const orderSchema = z.object({
  fullName: z.string().trim().min(3, "nameShort").max(80, "nameLong"),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const phone = normalizeDzPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "phone" });
        return z.NEVER;
      }
      return phone;
    }),
  wilaya: z.string().refine((v) => WILAYAS.some((w) => w.code === v), "wilaya"),
  /** Commune choisie dans la liste de la wilaya, ou OTHER_COMMUNE + saisie libre. */
  commune: z.string().trim().min(1, "commune").max(80, "commune"),
  communeOther: z.string().trim().max(80, "commune").optional().default(""),
  delivery: z.string().min(1, "delivery"),
  payment: z.string().min(1, "payment"),
  quantity: z.coerce.number().int().min(1, "quantity").max(commerce.maxQuantity, "quantity"),
  note: z.string().trim().max(300, "noteLong").optional().default(""),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
  /**
   * Cadeau pour un proche en Algérie : fullName/phone sont alors ceux du
   * destinataire (qui reçoit le colis et paie à la livraison), buyer* ceux de
   * la personne qui offre, souvent à l'étranger.
   */
  gift: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  buyerName: optionalText(80, "nameLong"),
  buyerPhone: optionalText(30, "buyerPhone"),
  buyerEmail: optionalText(120, "buyerEmail"),
  giftMessage: optionalText(200, "giftMessageLong"),
})
  // La commune doit appartenir à la wilaya choisie (ou être saisie à la main).
  .refine((o) => (o.commune === OTHER_COMMUNE ? o.communeOther.length >= 2 : isCommuneOf(o.wilaya, o.commune)), {
    message: "commune",
    path: ["commune"],
  })
  .refine((o) => !o.gift || o.buyerName.length >= 3, { message: "buyerName", path: ["buyerName"] })
  .refine((o) => !o.gift || normalizeIntlPhone(o.buyerPhone) !== null || normalizeDzPhone(o.buyerPhone) !== null, {
    message: "buyerPhone",
    path: ["buyerPhone"],
  })
  .refine((o) => !o.buyerEmail || z.email().safeParse(o.buyerEmail).success, { message: "buyerEmail", path: ["buyerEmail"] })
  .transform(({ communeOther, buyerName, buyerPhone, buyerEmail, ...o }) => ({
    ...o,
    commune: o.commune === OTHER_COMMUNE ? communeOther : o.commune,
    buyer: o.gift
      ? { name: buyerName, phone: normalizeIntlPhone(buyerPhone) ?? normalizeDzPhone(buyerPhone)!, email: buyerEmail || null }
      : null,
    giftMessage: o.gift ? o.giftMessage : "",
  }));

/**
 * Champs « cadeau » vérifiés à part : les règles de l'objet complet ne
 * s'exécutent qu'une fois les autres champs valides, or le client doit voir
 * toutes ses erreurs d'un coup.
 */
export function giftFieldErrors(values: Record<string, string>): Record<string, string> {
  if (values.gift !== "on") return {};
  const errors: Record<string, string> = {};
  const name = (values.buyerName ?? "").trim();
  const phone = values.buyerPhone ?? "";
  if (name.length < 3) errors.buyerName = "buyerName";
  if (!normalizeIntlPhone(phone) && !normalizeDzPhone(phone)) errors.buyerPhone = "buyerPhone";
  if (values.buyerEmail && !z.email().safeParse(values.buyerEmail.trim()).success) errors.buyerEmail = "buyerEmail";
  return errors;
}

export type OrderInput = z.input<typeof orderSchema>;
export type ValidOrder = z.output<typeof orderSchema>;
