/**
 * Efface les instructions des portraits terminés depuis le délai prévu et des
 * essais non retenus (voir src/lib/retention.ts). Le site le fait aussi tout
 * seul, au plus une fois toutes les 6 heures.
 *
 *   npm run portraits:purge
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { purgePortraits } from "../src/lib/retention";

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
purgePortraits(client)
  .then((r) => console.log(`Essais effacés : ${r.trials} ; portraits terminés effacés : ${r.finished}`))
  .finally(() => client.$disconnect());
