"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { audit, go, refreshSite } from "@/lib/admin/actionHelpers";
import { db } from "@/lib/db";

const PAGE = "/admin/stock";

/** Stock et ruptures : quantité suivie (vide = non suivie) et case « en rupture ». */
export async function saveStockAction(form: FormData): Promise<void> {
  const me = await requireAdmin("stock");
  const products = await db().product.findMany({ where: { kind: { in: ["KIT", "ACCESSORY"] } } });
  const changes: Record<string, { soldOut: boolean; stockQuantity: number | null }> = {};
  for (const p of products) {
    if (form.get(`seen_${p.slug}`) === null) continue;
    const raw = String(form.get(`qty_${p.slug}`) ?? "").replace(/\s/g, "");
    let qty: number | null = null;
    if (raw !== "") {
      qty = Number(raw);
      if (!Number.isInteger(qty) || qty < 0 || qty > 100_000) go(PAGE, { erreur: `Quantité invalide pour « ${(p.names as { fr: string }).fr} ».` });
    }
    // À 0 en stock, l'article passe en rupture ; sinon la case décide.
    const soldOut = qty === 0 || form.get(`soldout_${p.slug}`) === "on";
    if (soldOut !== p.soldOut || qty !== p.stockQuantity) {
      await db().product.update({ where: { id: p.id }, data: { soldOut, stockQuantity: qty } });
      changes[p.slug] = { soldOut, stockQuantity: qty };
    }
  }
  await audit(me.actor, "stock.saved", "catalogue", changes);
  refreshSite();
  go(PAGE, { ok: Object.keys(changes).length ? "Stock enregistré. Le site est déjà à jour." : "Aucun changement." });
}

/** Noms des articles (kit, options) dans les trois langues : panier, commande, WhatsApp. */
export async function saveNamesAction(form: FormData): Promise<void> {
  const me = await requireAdmin("prices");
  const products = await db().product.findMany({ where: { kind: { in: ["KIT", "ACCESSORY"] } } });
  for (const p of products) {
    const names = Object.fromEntries((["fr", "en", "ar"] as const).map((l) => [l, String(form.get(`name_${p.slug}_${l}`) ?? "").trim().slice(0, 80)]));
    if (!names.fr || !names.en || !names.ar) go("/admin/prix", { erreur: `Donnez un nom dans les trois langues à « ${(p.names as { fr: string }).fr} ».` });
    await db().product.update({ where: { id: p.id }, data: { names } });
  }
  await audit(me.actor, "products.renamed", "catalogue");
  refreshSite();
  go("/admin/prix", { ok: "Noms enregistrés." });
}
