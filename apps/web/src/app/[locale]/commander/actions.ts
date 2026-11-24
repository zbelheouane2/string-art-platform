"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { commerce } from "@/config/commerce";
import { clientFingerprint } from "@/lib/clientIp";
import { db } from "@/lib/db";
import { createOrder } from "@/lib/orders";
import { HONEYPOT, giftFieldErrors, orderSchema } from "@/lib/orderSchema";

export type OrderState = {
  /** Champ → clé d'erreur (traduite dans le formulaire). */
  fieldErrors: Record<string, string>;
  formError: string | null;
  values: Record<string, string>;
};

export async function orderAction(_prev: OrderState, form: FormData): Promise<OrderState> {
  // Anti-spam discret (pas de captcha) : champ piège rempli → refus sans détail.
  if (String(form.get(HONEYPOT) ?? "").trim()) return { fieldErrors: {}, formError: "check", values: {} };
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v).slice(0, 400)]));
  // Plusieurs cases « options » cochées : on les regroupe en une liste.
  values.options = form.getAll("options").map(String).join(",").slice(0, 400);
  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    Object.assign(fieldErrors, giftFieldErrors(values), fieldErrors);
    return { fieldErrors, formError: null, values };
  }
  // Anti-spam : nombre de commandes par appareil sur la fenêtre (empreinte de l'IP, jamais l'IP).
  const fingerprint = await clientFingerprint();
  const since = new Date(Date.now() - commerce.orderLimit.windowMinutes * 60_000);
  const recent = await db().auditLog.count({ where: { action: "order.device", target: fingerprint, createdAt: { gte: since } } });
  if (recent >= commerce.orderLimit.max) return { fieldErrors: {}, formError: "tooMany", values };
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.PUBLIC_BASE_URL ?? `${proto}://${h.get("host")}`;
  const result = await createOrder(parsed.data, base);
  if (!result.ok) return { fieldErrors: {}, formError: result.error, values };
  await db().auditLog.create({ data: { actor: "system", action: "order.device", target: fingerprint } });
  redirect(result.redirect ?? `/${parsed.data.locale}/commande/${result.number}`);
}
