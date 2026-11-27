import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { addCarrierAction } from "../actions";
import { AdminShell, Flash, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function CarriersPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("delivery");
  const q = await searchParams;
  const carriers = await db().carrier.findMany({ orderBy: { createdAt: "asc" } });
  const methods = await db().deliveryMethod.findMany({ include: { _count: { select: { rates: true } } } });
  return (
    <AdminShell title="Livraison" current="/admin/livraison">
      <Flash ok={q.ok} error={q.erreur} />
      <p className="a-muted">Chaque société a ses tarifs par wilaya, à domicile et au bureau. Si plusieurs sociétés sont actives, le client choisit la sienne et voit son prix pour sa wilaya. Une wilaya sans tarif n&apos;est pas livrée par cette société : le client ne peut pas la choisir avec ce mode.</p>
      <ul className="a-cards">
        {carriers.map((c) => {
          const ms = methods.filter((m) => m.provider === c.code);
          const rates = ms.reduce((n, m) => n + m._count.rates, 0);
          return (
            <li key={c.id} className="a-card">
              <div className="a-card-head">
                {c.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" width={36} height={36} />
                )}
                <strong>{c.name}</strong>
                <span className={`a-pill ${c.active ? "a-pill-on" : ""}`}>{c.active ? "Active" : "Inactive"}</span>
              </div>
              <p className="a-small">
                {rates} tarifs enregistrés · mis à jour le {dateFr(c.ratesUpdatedAt)}
              </p>
              <Link href={`/admin/livraison/${c.code}`} className="a-btn a-btn-sm">
                Tarifs et réglages
              </Link>
            </li>
          );
        })}
      </ul>
      <details className="a-card">
        <summary className="a-summary">Ajouter une société de livraison</summary>
        <form action={addCarrierAction} className="a-grid">
          <label>
            Nom affiché
            <input name="name" className="a-input" required placeholder="Yalidine" maxLength={60} />
          </label>
          <label>
            Identifiant (minuscules, sans espace)
            <input name="code" className="a-input" required placeholder="yalidine" pattern="[a-z][a-z0-9]{1,29}" />
          </label>
          <label className="a-span">
            Logo (adresse https:// ou chemin du site, facultatif)
            <input name="logoUrl" className="a-input" placeholder="/visuels/livraison/yalidine.png" />
          </label>
          <button type="submit" className="a-btn">
            Ajouter
          </button>
        </form>
      </details>
    </AdminShell>
  );
}
