"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createOrder } from "@/lib/orders";
import { giftFieldErrors, orderSchema } from "@/lib/orderSchema";

export type OrderState = {
  /** Champ → clé d'erreur (traduite dans le formulaire). */
  fieldErrors: Record<string, string>;
  formError: string | null;
  values: Record<string, string>;
};

export async function orderAction(_prev: OrderState, form: FormData): Promise<OrderState> {
  const values = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v).slice(0, 400)]));
  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    Object.assign(fieldErrors, giftFieldErrors(values), fieldErrors);
    return { fieldErrors, formError: null, values };
  }
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.PUBLIC_BASE_URL ?? `${proto}://${h.get("host")}`;
  const result = await createOrder(parsed.data, base);
  if (!result.ok) return { fieldErrors: {}, formError: result.error, values };
  redirect(result.redirect ?? `/${parsed.data.locale}/commande/${result.number}`);
}
