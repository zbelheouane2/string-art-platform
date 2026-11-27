import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { saveStockAction } from "../_actions/catalog";
import { AdminShell, Flash } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Stock du kit et des options : quantité restante et ruptures. */
export default async function StockPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("stock");
  const q = await searchParams;
  const products = await db().product.findMany({ where: { kind: { in: ["KIT", "ACCESSORY"] } }, orderBy: [{ kind: "desc" }, { slug: "asc" }] });
  return (
    <AdminShell
      title="Stock"
      current="/admin/stock"
      lead="Indiquez combien il vous reste de chaque article, ou laissez vide si vous ne comptez pas. Chaque commande confirmée retire ses articles ; à 0, l'article passe en rupture tout seul. Kit en rupture : le site affiche « commandes fermées ». Option en rupture : elle n'est plus proposée."
    >
      <Flash ok={q.ok} error={q.erreur} />
      <form action={saveStockAction} className="a-card">
        <table className="a-table a-table-cards">
          <thead>
            <tr>
              <th>Article</th>
              <th>En stock</th>
              <th>Rupture</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const name = (p.names as { fr: string }).fr;
              return (
                <tr key={p.id}>
                  <td data-label="Article">
                    <strong>{name}</strong>
                    <input type="hidden" name={`seen_${p.slug}`} value="1" />
                    {p.soldOut && <span className="a-tag">En rupture sur le site</span>}
                    {!p.active && <span className="a-tag">Non proposé (Prix et options)</span>}
                  </td>
                  <td data-label="En stock">
                    <label className="visually-hidden" htmlFor={`qty_${p.slug}`}>
                      Quantité en stock : {name}
                    </label>
                    <input id={`qty_${p.slug}`} name={`qty_${p.slug}`} className="a-input a-input-num" inputMode="numeric" defaultValue={p.stockQuantity ?? ""} placeholder="non suivi" />
                  </td>
                  <td data-label="Rupture">
                    <label className="a-check-inline">
                      <input type="checkbox" name={`soldout_${p.slug}`} defaultChecked={p.soldOut} /> En rupture
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="submit" className="a-btn">
          Enregistrer le stock
        </button>
      </form>
    </AdminShell>
  );
}
