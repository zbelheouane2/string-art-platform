/**
 * Crée un lot de codes d'activation et écrit le fichier CSV pour l'imprimeur.
 *
 *   npm run codes:create -- --count 200 --batch 2026-11-A [--out codes.csv]
 *
 * Le CSV contient uniquement les codes (aucune donnée client). Les codes sont
 * tirés au hasard par un générateur cryptographique ; un doublon éventuel est
 * simplement retiré.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateCode } from "../src/lib/codes";

const { values } = parseArgs({
  options: { count: { type: "string", default: "50" }, batch: { type: "string" }, out: { type: "string" } },
});
const count = Number(values.count);
if (!Number.isInteger(count) || count < 1 || count > 10_000) throw new Error("--count doit être entre 1 et 10 000");
if (!values.batch || !/^[\w-]{1,40}$/.test(values.batch)) throw new Error("--batch obligatoire (lettres, chiffres, tirets)");
const batch = values.batch;
const out = values.out ?? `codes-${batch}.csv`;

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateCode());
  const { count: created } = await db.activationCode.createMany({ data: [...codes].map((code) => ({ code, batch })), skipDuplicates: true });
  const rows = await db.activationCode.findMany({ where: { batch }, select: { code: true }, orderBy: { createdAt: "asc" } });
  writeFileSync(out, ["code", ...rows.map((r) => r.code)].join("\n") + "\n");
  await db.auditLog.create({ data: { actor: "admin:cli", action: "codes.created", target: batch, meta: { created } } });
  console.log(`${created} codes créés dans le lot ${batch} (${rows.length} au total) → ${out}`);
}

main().finally(() => db.$disconnect());
