import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { wilayaName } from "@/config/wilayas";
import { setOrderStatusAction } from "../actions";
import { AdminShell, Flash, STATUS_FR, da, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

type Address = { recipient?: { fullName?: string; phone?: string }; wilaya?: string; commune?: string; note?: string; gift?: { message?: string } | null };

/** Commandes (100 dernières), filtrables par état. Données personnelles visibles ici seulement. */
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ etat?: string; ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const q = await searchParams;
  const etat = q.etat && q.etat in STATUS_FR ? q.etat : undefined;
  const orders = await db().order.findMany({
    where: etat ? { status: etat as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, deliveryMethod: true, items: { include: { product: true } } },
  });
  const carriers = await db().carrier.findMany();
  return (
    <AdminShell title="Commandes" current="/admin/commandes">
      <Flash ok={q.ok} error={q.erreur} />
      <nav className="a-filters" aria-label="Filtrer par état">
        <Link href="/admin/commandes" aria-current={!etat ? "page" : undefined}>
          Toutes
        </Link>
        {Object.entries(STATUS_FR).map(([k, v]) => (
          <Link key={k} href={`/admin/commandes?etat=${k}`} aria-current={etat === k ? "page" : undefined}>
            {v}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="a-muted">Aucune commande.</p>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table a-table-cards">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Livraison</th>
                <th>Articles</th>
                <th>Total</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const a = o.shippingAddress as Address;
                const carrier = carriers.find((c) => c.code === o.deliveryMethod?.provider);
                return (
                  <tr key={o.id}>
                    <td data-label="Commande">
                      <strong>{o.number}</strong>
                      <br />
                      <span className="a-muted">{dateFr(o.createdAt)}</span>
                    </td>
                    <td data-label="Client">
                      {a.recipient?.fullName}
                      <br />
                      <a href={`tel:${a.recipient?.phone}`}>{a.recipient?.phone}</a>
                      {a.gift && <span className="a-tag">Cadeau · acheteur {o.customer.fullName} {o.customer.phone}</span>}
                    </td>
                    <td data-label="Livraison">
                      {a.wilaya} - {wilayaName(a.wilaya ?? "", "fr")}, {a.commune}
                      <br />
                      <span className="a-muted">
                        {carrier?.name ?? o.deliveryMethod?.provider} · {o.deliveryMethod?.code.endsWith("_desk") ? "bureau" : "domicile"} · {o.deliveryFeeMinor === null ? "frais à confirmer" : da(o.deliveryFeeMinor)}
                      </span>
                      {a.note && <span className="a-tag">Note : {a.note}</span>}
                    </td>
                    <td data-label="Articles">
                      {o.items.map((i) => (
                        <div key={i.id}>
                          {i.quantity} × {(i.product.names as { fr: string }).fr}
                        </div>
                      ))}
                      {o.promoCode && (
                        <span className="a-tag">
                          {o.promoCode} : − {da(o.discountMinor)}
                        </span>
                      )}
                    </td>
                    <td data-label="Total">
                      <strong>{da(o.totalMinor)}</strong>
                    </td>
                    <td data-label="État">
                      <form action={setOrderStatusAction} className="a-inline">
                        <input type="hidden" name="number" value={o.number} />
                        <label className="visually-hidden" htmlFor={`st-${o.number}`}>
                          État de {o.number}
                        </label>
                        <select id={`st-${o.number}`} name="status" defaultValue={o.status} className="a-input a-input-sm">
                          {Object.entries(STATUS_FR).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="a-btn a-btn-sm">
                          OK
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
