import { z } from "zod";
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

/** Validation partagée par le formulaire (navigateur) et le serveur. Messages = clés de traduction. */
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
  commune: z.string().trim().min(2, "commune").max(80, "commune"),
  address: z.string().trim().max(200, "addressLong").optional().default(""),
  delivery: z.string().min(1, "delivery"),
  payment: z.string().min(1, "payment"),
  quantity: z.coerce.number().int().min(1, "quantity").max(commerce.maxQuantity, "quantity"),
  note: z.string().trim().max(300, "noteLong").optional().default(""),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
})
  // À domicile, l'adresse est obligatoire ; au bureau du transporteur, la commune suffit.
  .refine((o) => !o.delivery.endsWith("_home") || o.address.length >= 5, { message: "address", path: ["address"] });

export type OrderInput = z.input<typeof orderSchema>;
export type ValidOrder = z.output<typeof orderSchema>;
