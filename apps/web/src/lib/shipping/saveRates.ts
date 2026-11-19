import type { PrismaClient } from "@/generated/prisma/client";
import type { RateRow } from "./rateFile";

export interface RateChange {
  zone: string;
  kind: "home" | "desk";
  before: number | null;
  after: number | null;
}

type Db = Pick<PrismaClient, "deliveryMethod" | "deliveryRate" | "carrier" | "market">;

/** Tarifs actuels d'une société : wilaya → { home, desk } en dinars (unité principale). */
export async function currentRates(db: Db, carrier: string, marketCode = "DZ"): Promise<Map<string, { home: number | null; desk: number | null }>> {
  const market = await db.market.findUniqueOrThrow({ where: { code: marketCode } });
  const methods = await db.deliveryMethod.findMany({ where: { marketId: market.id, provider: carrier }, include: { rates: true } });
  const out = new Map<string, { home: number | null; desk: number | null }>();
  for (const m of methods) {
    const kind = m.code.endsWith("_desk") ? "desk" : "home";
    for (const r of m.rates) {
      const row = out.get(r.zone) ?? { home: null, desk: null };
      row[kind] = r.amountMinor / 100;
      out.set(r.zone, row);
    }
  }
  return out;
}

/** Différences entre les tarifs actuels et un fichier (aperçu avant validation). */
export function diffRates(current: Map<string, { home: number | null; desk: number | null }>, rows: RateRow[]): RateChange[] {
  const changes: RateChange[] = [];
  for (const row of rows) {
    for (const kind of ["home", "desk"] as const) {
      const before = current.get(row.zone)?.[kind] ?? null;
      if (before !== row[kind]) changes.push({ zone: row.zone, kind, before, after: row[kind] });
    }
  }
  return changes.sort((a, b) => a.zone.localeCompare(b.zone) || a.kind.localeCompare(b.kind));
}

/**
 * Enregistre les tarifs d'une société (montants en dinars ; null supprime le tarif :
 * le client verra « confirmé par téléphone »). Met à jour la date des tarifs.
 */
export async function saveRates(db: Db, carrier: string, rows: RateRow[], source: string, marketCode = "DZ"): Promise<{ set: number; cleared: number }> {
  const market = await db.market.findUniqueOrThrow({ where: { code: marketCode } });
  const methods = await db.deliveryMethod.findMany({ where: { marketId: market.id, provider: carrier } });
  const byKind = { home: methods.find((m) => m.code.endsWith("_home")), desk: methods.find((m) => m.code.endsWith("_desk")) };
  let set = 0;
  let cleared = 0;
  for (const row of rows) {
    for (const kind of ["home", "desk"] as const) {
      const method = byKind[kind];
      if (!method) continue;
      const amount = row[kind];
      if (amount === null) {
        cleared += (await db.deliveryRate.deleteMany({ where: { deliveryMethodId: method.id, zone: row.zone } })).count;
      } else {
        const data = { amountMinor: amount * 100, currency: market.currency, source };
        await db.deliveryRate.upsert({
          where: { deliveryMethodId_zone: { deliveryMethodId: method.id, zone: row.zone } },
          update: data,
          create: { ...data, deliveryMethodId: method.id, zone: row.zone },
        });
        set++;
      }
    }
  }
  await db.carrier.updateMany({ where: { code: carrier }, data: { ratesUpdatedAt: new Date() } });
  return { set, cleared };
}
