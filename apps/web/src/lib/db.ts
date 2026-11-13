import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Client unique (réutilisé en développement malgré le rechargement à chaud). */
export function db(): PrismaClient {
  globalForPrisma.prisma ??= create();
  return globalForPrisma.prisma;
}
