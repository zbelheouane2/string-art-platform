import "server-only";
import { commerce } from "@/config/commerce";
import { parseCode } from "./codes";
import { db } from "./db";

export type RedeemResult =
  | { ok: true; codeId: string; chosenGenerationId: string | null }
  | { ok: false; error: "format" | "unknown" | "disabled" | "tooMany" };

/** Nombre d'essais de codes inconnus récents pour cet appareil. */
async function recentFailures(fingerprint: string): Promise<number> {
  const since = new Date(Date.now() - commerce.codeAttempts.windowMinutes * 60_000);
  return db().auditLog.count({ where: { action: "code.failed", target: fingerprint, createdAt: { gte: since } } });
}

/**
 * Vérifie un code saisi. Une faute de frappe (clé de contrôle fausse) est
 * signalée sans consulter la base ; un code bien formé mais inconnu compte
 * comme un essai, limité par appareil (anti force brute).
 */
export async function redeemCode(input: string, fingerprint: string): Promise<RedeemResult> {
  const parsed = parseCode(input);
  if (!parsed.ok) return { ok: false, error: "format" };
  if ((await recentFailures(fingerprint)) >= commerce.codeAttempts.max) return { ok: false, error: "tooMany" };

  const code = await db().activationCode.findUnique({
    where: { code: parsed.code },
    select: { id: true, status: true, generations: { where: { chosen: true }, select: { id: true }, take: 1 } },
  });
  if (!code) {
    await db().auditLog.create({ data: { actor: "system", action: "code.failed", target: fingerprint } });
    return { ok: false, error: "unknown" };
  }
  if (code.status === "DISABLED") return { ok: false, error: "disabled" };

  await db().activationCode.update({ where: { id: code.id }, data: { redeemedAt: code.status === "ACTIVE" ? new Date() : undefined } });
  await db().auditLog.create({ data: { actor: "system", action: "code.opened", target: code.id } });
  return { ok: true, codeId: code.id, chosenGenerationId: code.generations[0]?.id ?? null };
}
