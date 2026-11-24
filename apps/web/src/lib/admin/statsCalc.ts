/** Calcul des statistiques de ventes (sans accès à la base : testable). */
export interface StatOrder {
  status: string;
  totalMinor: number;
  createdAt: Date;
  wilaya: string;
  promoCode: string | null;
  items: { kind: string; name: string; quantity: number }[];
}

const LOST = new Set(["CANCELLED", "RETURNED"]);

/** Jour en Algérie (UTC+1), « 2026-11-24 ». */
export const dayKey = (d: Date) => new Date(d.getTime() + 3_600_000).toISOString().slice(0, 10);

export function computeStats(orders: StatOrder[], days: number, now = new Date()) {
  const valid = orders.filter((o) => !LOST.has(o.status));
  const revenue = valid.reduce((s, o) => s + o.totalMinor, 0);
  const kits = valid.reduce((s, o) => s + o.items.filter((i) => i.kind === "KIT").reduce((a, i) => a + i.quantity, 0), 0);
  const decided = orders.filter((o) => o.status !== "PENDING");
  const confirmed = decided.filter((o) => o.status !== "CANCELLED").length;

  const perDay = new Map<string, { orders: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) perDay.set(dayKey(new Date(now.getTime() - i * 86_400_000)), { orders: 0, revenue: 0 });
  for (const o of orders) {
    const d = perDay.get(dayKey(o.createdAt));
    if (!d) continue;
    d.orders++;
    if (!LOST.has(o.status)) d.revenue += o.totalMinor;
  }

  const count = <K extends string>(keys: K[]) => {
    const m = new Map<K, number>();
    for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const products = new Map<string, number>();
  for (const o of valid) for (const i of o.items) products.set(i.name, (products.get(i.name) ?? 0) + i.quantity);

  return {
    orders: orders.length,
    revenue,
    kits,
    average: valid.length ? Math.round(revenue / valid.length) : 0,
    /** Part des commandes traitées qui n'ont pas été annulées (en %), null si aucune traitée. */
    confirmRate: decided.length ? Math.round((confirmed / decided.length) * 100) : null,
    perDay: [...perDay.entries()].map(([day, v]) => ({ day, ...v })),
    byStatus: count(orders.map((o) => o.status)),
    byWilaya: count(valid.map((o) => o.wilaya)).slice(0, 10),
    byPromo: count(valid.flatMap((o) => (o.promoCode ? [o.promoCode] : []))).slice(0, 10),
    products: [...products.entries()].sort((a, b) => b[1] - a[1]),
  };
}
