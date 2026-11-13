/**
 * Importe la grille de frais de livraison d'un transporteur.
 *
 *   npm run rates:import -- --carrier zrexpress --file tarifs.csv
 *
 * Modèle : prisma/data/tarifs-livraison-modele.csv (69 wilayas, montants vides).
 * Une cellule vide supprime le tarif (le client verra « confirmé par téléphone »).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseRateFile } from "../src/lib/shipping/rateFile";

const { values } = parseArgs({ options: { carrier: { type: "string", default: "zrexpress" }, file: { type: "string" }, market: { type: "string", default: "DZ" } } });
if (!values.file) throw new Error("--file obligatoire");
const parsed = parseRateFile(readFileSync(values.file, "utf-8"));
if (!parsed.ok) {
  console.error(parsed.errors.join("\n"));
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  if (!parsed.ok) return;
  const market = await db.market.findUniqueOrThrow({ where: { code: values.market } });
  const methods = await db.deliveryMethod.findMany({ where: { marketId: market.id, provider: values.carrier } });
  const byKind = { home: methods.find((m) => m.code.endsWith("_home")), desk: methods.find((m) => m.code.endsWith("_desk")) };
  let set = 0;
  let cleared = 0;
  for (const row of parsed.rows) {
    for (const kind of ["home", "desk"] as const) {
      const method = byKind[kind];
      if (!method) continue;
      const where = { deliveryMethodId_zone: { deliveryMethodId: method.id, zone: row.zone } };
      const amount = row[kind];
      if (amount === null) {
        cleared += (await db.deliveryRate.deleteMany({ where: { deliveryMethodId: method.id, zone: row.zone } })).count;
      } else {
        const data = { amountMinor: amount * 100, currency: market.currency, source: "fichier" };
        await db.deliveryRate.upsert({ where, update: data, create: { ...data, deliveryMethodId: method.id, zone: row.zone } });
        set++;
      }
    }
  }
  await db.auditLog.create({ data: { actor: "admin:cli", action: "rates.imported", target: values.carrier, meta: { set, cleared } } });
  console.log(`${set} tarifs enregistrés, ${cleared} supprimés (${values.carrier}).`);
}

main().finally(() => db.$disconnect());
