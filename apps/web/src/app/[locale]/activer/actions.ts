"use server";

import { redirect } from "next/navigation";
import { redeemCode, type RedeemResult } from "@/lib/activation";
import { clientFingerprint } from "@/lib/clientIp";
import { openCodeSession } from "@/lib/session";

export type ActivateState = { error: Exclude<RedeemResult, { ok: true }>["error"] | null; value: string };

export async function activateAction(_prev: ActivateState, form: FormData): Promise<ActivateState> {
  const value = String(form.get("code") ?? "").slice(0, 32);
  const locale = ["fr", "en", "ar"].includes(String(form.get("locale"))) ? String(form.get("locale")) : "fr";
  const result = await redeemCode(value, await clientFingerprint());
  if (!result.ok) return { error: result.error, value };
  await openCodeSession(result.codeId);
  redirect(result.chosenGenerationId ? `/${locale}/guide/${result.chosenGenerationId}` : `/${locale}/creer`);
}
