import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { wilayaName } from "@/config/wilayas";
import { confirmationLink } from "@/lib/admin/orderConfirmation";
import { setOrderStatusAction } from "../actions";
import { AdminShell, Flash, STATUS_FR, da, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Recherche : numéro de commande, nom ou téléphone (client ou destinataire). */
function searchWhere(term: string): Prisma.OrderWhereInput {
  const digits = term.replace(/\D/g, "");
  return {
    OR: [
      { number: { contains: term.toUpperCase() } },
      { customer: { fullName: { contains: term, mode: "insensitive" } } },
      { shippingAddress: { path: ["recipient", "fullName"], string_contains: term } },
      ...(digits.length >= 4 ? [{ customer: { phone: { contains: digits } } }, { shippingAddress: { path: ["recipient", "phone"], string_contains: digits } }] : []),
    ],
  };
}

type Address = { recipient?: { fullName?: string; phone?: string }; wilaya?: string; commune?: string; note?: string; gift?: { message?: string } | null };

/** Commandes (100 dernières), filtrables par état. Données personnelles visibles ici seulement. */
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ etat?: string; q?: string; ok?: string; erreur?: string }> }) {
  const me = await requireAdmin("orders");
  const q = await searchParams;
  const etat = q.etat && q.etat in STATUS_FR ? q.etat : undefined;
  const search = (q.q ?? "").trim().slice(0, 60);
  const orders = await db().order.findMany({
    where: { ...(etat ? { status: etat as never } : {}), ...(search ? searchWhere(search) : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, deliveryMethod: true, items: { include: { product: true } } },
  });
  const carriers = await db().carrier.findMany();
  return (
    <AdminShell title="Commandes" current="/admin/commandes">
      <Flash ok={q.ok} error={q.erreur} />
      <div className="a-toolbar">
        <form className="a-inline" role="search">
          {etat && <input type="hidden" name="etat" value={etat} />}
          <label className="visually-hidden" htmlFor="order-search">
            Rechercher une commande
          </label>
          <input id="order-search" name="q" type="search" className="a-input" defaultValue={search} placeholder="Numéro, nom ou téléphone" />
          <button type="submit" className="a-btn a-btn-sm">
            Rechercher
          </button>
        </form>
        {can(me.role, "ordersExport") && (
          <a className="a-btn a-btn-sm a-btn-ghost" href={`/admin/commandes/export.xlsx${etat ? `?etat=${etat}` : ""}`}>
            Exporter en Excel
          </a>
        )}
      </div>
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
                // Cadeau : on confirme avec l'acheteur (le destinataire ne doit pas forcément savoir).
                const contact = a.gift ? { fullName: o.customer.fullName, phone: o.customer.phone ?? "" } : { fullName: a.recipient?.fullName ?? "", phone: a.recipient?.phone ?? "" };
                const waLink =
                  o.status === "PENDING"
                    ? confirmationLink({
                        number: o.number,
                        locale: o.customer.locale,
                        ...contact,
                        items: o.items.map((i) => ({ quantity: i.quantity, names: i.product.names as Record<string, string> })),
                        totalMinor: o.totalMinor,
                        currency: o.currency,
                        deliveryPending: o.deliveryFeeMinor === null,
                        wilaya: a.wilaya ?? "",
                        giftRecipient: a.gift ? (a.recipient?.fullName ?? null) : null,
                      })
                    : null;
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
                      <span className={`a-status a-status-${o.status.toLowerCase()}`}>{STATUS_FR[o.status]}</span>
                      {o.status === "PENDING" && (
                        <div className="a-confirm">
                          {waLink ? (
                            <a className="a-btn a-btn-sm a-btn-wa" href={waLink} target="_blank" rel="noopener noreferrer">
                              Confirmer sur WhatsApp
                            </a>
                          ) : (
                            <span className="a-muted">Numéro WhatsApp invalide</span>
                          )}
                          <form action={setOrderStatusAction}>
                            <input type="hidden" name="number" value={o.number} />
                            <input type="hidden" name="status" value="CONFIRMED" />
                            <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                              Marquer confirmée
                            </button>
                          </form>
                        </div>
                      )}
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
