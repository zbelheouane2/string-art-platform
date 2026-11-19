import type { PrismaClient } from "@/generated/prisma/client";
import { generateCode } from "@/lib/codes";

/** Nom de lot accepté (lettres, chiffres, tirets), comme le script en ligne de commande. */
export const BATCH_RE = /^[\w-]{1,40}$/;
export const MAX_BATCH = 2000;

/** Crée `count` codes neufs dans un lot (un doublon éventuel est tiré à nouveau). */
export async function createCodeBatch(db: PrismaClient, batch: string, count: number): Promise<number> {
  if (!BATCH_RE.test(batch)) throw new Error("Nom de lot invalide.");
  if (!Number.isInteger(count) || count < 1 || count > MAX_BATCH) throw new Error(`Nombre de codes entre 1 et ${MAX_BATCH}.`);
  let created = 0;
  for (let round = 0; created < count && round < 5; round++) {
    const codes = new Set<string>();
    while (codes.size < count - created) codes.add(generateCode());
    const r = await db.activationCode.createMany({ data: [...codes].map((code) => ({ code, batch })), skipDuplicates: true });
    created += r.count;
  }
  return created;
}

/** Fichier pour l'imprimeur : uniquement les codes du lot (aucune donnée client). */
export async function codeBatchCsv(db: PrismaClient, batch: string): Promise<string | null> {
  const rows = await db.activationCode.findMany({ where: { batch }, select: { code: true }, orderBy: { createdAt: "asc" } });
  if (!rows.length) return null;
  return ["code", ...rows.map((r) => r.code)].join("\r\n") + "\r\n";
}
