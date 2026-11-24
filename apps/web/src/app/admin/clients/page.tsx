import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { customerList } from "@/lib/admin/customers";
import { wilayaName } from "@/config/wilayas";
import { AdminShell, da, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

/** Clients (une fiche par téléphone) : nombre de commandes, montant, dernière commande. */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("customers");
  const q = (await searchParams).q?.trim().toLowerCase() ?? "";
  const all = await customerList();
  const digits = q.replace(/\D/g, "");
  const list = q ? all.filter((c) => c.fullName.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.includes(digits))) : all;
  const repeat = all.filter((c) => c.orders > 1).length;
  return (
    <AdminShell title="Clients" current="/admin/clients" lead="Une fiche par numéro de téléphone. Ces données sont personnelles : ne les partagez pas et exportez-les seulement si nécessaire.">
      <ul className="a-stats">
        <li>
          <span>Clients</span>
          <strong>{all.length}</strong>
        </li>
        <li>
          <span>Clients fidèles (2 commandes ou plus)</span>
          <strong>{repeat}</strong>
        </li>
      </ul>
      <div className="a-toolbar">
        <form className="a-inline" role="search">
          <label className="visually-hidden" htmlFor="client-search">
            Rechercher un client
          </label>
          <input id="client-search" name="q" type="search" className="a-input" defaultValue={q} placeholder="Nom ou téléphone" />
          <button type="submit" className="a-btn a-btn-sm">
            Rechercher
          </button>
        </form>
        <a className="a-btn a-btn-sm a-btn-ghost" href="/admin/clients/export.xlsx">
          Exporter en Excel
        </a>
      </div>
      {list.length === 0 ? (
        <p className="a-muted">Aucun client.</p>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table a-table-cards">
            <thead>
              <tr>
                <th>Client</th>
                <th>Wilaya</th>
                <th>Commandes</th>
                <th>Montant</th>
                <th>Dernière commande</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 300).map((c) => (
                <tr key={c.key}>
                  <td data-label="Client">
                    <strong>{c.fullName}</strong>
                    <br />
                    {c.phone && <a href={`tel:${c.phone}`}>{c.phone}</a>}
                    {c.email && <span className="a-muted"> · {c.email}</span>}
                  </td>
                  <td data-label="Wilaya">{c.wilaya ? `${c.wilaya} - ${wilayaName(c.wilaya, "fr") ?? ""}` : "—"}</td>
                  <td data-label="Commandes">{c.orders}</td>
                  <td data-label="Montant">{da(c.spentMinor)}</td>
                  <td data-label="Dernière">
                    <Link href={`/admin/commandes?q=${c.lastNumber}`}>{c.lastNumber}</Link>
                    <br />
                    <span className="a-muted">{dateFr(c.lastAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
