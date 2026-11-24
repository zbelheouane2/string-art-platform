import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { savePricesAction } from "../actions";
import { saveNamesAction } from "../_actions/catalog";
import { Texts3 } from "../_ui/Texts3";
import { AdminShell, Flash } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Prix du kit et des options (en dinars), options affichées ou non. */
export default async function PricesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("prices");
  const q = await searchParams;
  const market = await db().market.findUniqueOrThrow({ where: { code: "DZ" } });
  const products = await db().product.findMany({
    where: { kind: { in: ["KIT", "ACCESSORY"] } },
    include: { prices: { where: { marketId: market.id } } },
    orderBy: [{ kind: "desc" }, { slug: "asc" }],
  });
  return (
    <AdminShell title="Prix et options" current="/admin/prix">
      <Flash ok={q.ok} error={q.erreur} />
      <p className="a-muted">Montants en dinars. Une option sans prix ou décochée n&apos;est plus proposée aux clients. Le nouveau prix s&apos;affiche tout de suite sur le site ; les commandes déjà passées gardent leur prix.</p>
      <form action={savePricesAction} className="a-card">
        <table className="a-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Prix (DA)</th>
              <th>Proposé</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <label htmlFor={`price_${p.slug}`}>{(p.names as { fr: string }).fr}</label>
                </td>
                <td>
                  <input
                    id={`price_${p.slug}`}
                    name={`price_${p.slug}`}
                    className="a-input a-input-num"
                    inputMode="numeric"
                    defaultValue={p.prices[0] ? String(p.prices[0].amountMinor / 100) : ""}
                    required={p.kind === "KIT"}
                  />
                </td>
                <td>
                  {p.kind === "ACCESSORY" ? (
                    <input type="checkbox" name={`active_${p.slug}`} defaultChecked={p.active} aria-label={`Proposer ${(p.names as { fr: string }).fr}`} />
                  ) : (
                    <span className="a-muted">toujours</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit" className="a-btn">
          Enregistrer les prix
        </button>
      </form>
      <form action={saveNamesAction} className="a-card a-stack">
        <h2>Noms des articles</h2>
        <p className="a-muted">Affichés dans le panier, la commande et le message WhatsApp de confirmation.</p>
        {products.map((p) => (
          <fieldset key={p.id} className="a-faq-item">
            <legend>{(p.names as { fr: string }).fr}</legend>
            <Texts3 prefix={`name_${p.slug}`} values={p.names as Record<string, string>} max={80} />
          </fieldset>
        ))}
        <div>
          <button type="submit" className="a-btn">
            Enregistrer les noms
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
