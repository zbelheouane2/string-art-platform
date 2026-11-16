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
import { saveRates } from "../src/lib/shipping/saveRates";

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
  const { set, cleared } = await saveRates(db, values.carrier!, parsed.rows, "fichier", values.market);
  await db.auditLog.create({ data: { actor: "admin:cli", action: "rates.imported", target: values.carrier, meta: { set, cleared } } });
  console.log(`${set} tarifs enregistrés, ${cleared} supprimés (${values.carrier}).`);
}

main().finally(() => db.$disconnect());
