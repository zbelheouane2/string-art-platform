import { requireAdmin } from "@/lib/admin/auth";
import { MAX_BATCH } from "@/lib/admin/codeBatches";
import { db } from "@/lib/db";
import { createCodesAction } from "../actions";
import { AdminShell, Flash } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function CodesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("codes");
  const q = await searchParams;
  const groups = await db().activationCode.groupBy({ by: ["batch", "status"], _count: { _all: true }, _min: { createdAt: true } });
  const batches = new Map<string, { total: number; used: number; disabled: number; since: Date }>();
  for (const g of groups) {
    const key = g.batch ?? "(sans lot)";
    const b = batches.get(key) ?? { total: 0, used: 0, disabled: 0, since: g._min.createdAt ?? new Date() };
    b.total += g._count._all;
    if (g.status === "USED") b.used += g._count._all;
    if (g.status === "DISABLED") b.disabled += g._count._all;
    if (g._min.createdAt && g._min.createdAt < b.since) b.since = g._min.createdAt;
    batches.set(key, b);
  }
  const list = [...batches.entries()].sort((a, b) => b[1].since.getTime() - a[1].since.getTime());
  const suggested = `lot-${new Date().toISOString().slice(0, 10)}`;
  return (
    <AdminShell title="Codes d'activation" current="/admin/codes">
      <Flash ok={q.ok} error={q.erreur} />
      <section className="a-card">
        <h2>Créer un lot de codes</h2>
        <p className="a-muted">Un code par kit, à imprimer dans la boîte. Le fichier téléchargé contient uniquement les codes.</p>
        <form action={createCodesAction} className="a-grid">
          <label>
            Nombre de codes
            <input name="count" className="a-input" required inputMode="numeric" defaultValue="100" />
          </label>
          <label>
            Nom du lot (lettres, chiffres, tirets)
            <input name="batch" className="a-input" required defaultValue={suggested} maxLength={40} pattern="[\w\-]{1,40}" />
          </label>
          <button type="submit" className="a-btn">
            Créer les codes
          </button>
        </form>
        <p className="a-small a-muted">{MAX_BATCH} codes au plus par envoi ; vous pouvez compléter un lot en réutilisant son nom.</p>
      </section>

      {list.length === 0 ? (
        <p className="a-muted">Aucun code pour l&apos;instant.</p>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Codes</th>
                <th>Utilisés</th>
                <th>Désactivés</th>
                <th>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {list.map(([batch, b]) => (
                <tr key={batch}>
                  <td>
                    <strong>{batch}</strong>
                  </td>
                  <td>{b.total}</td>
                  <td>{b.used}</td>
                  <td>{b.disabled}</td>
                  <td>
                    {batch !== "(sans lot)" && (
                      <a className="a-btn a-btn-sm a-btn-ghost" href={`/admin/codes/${encodeURIComponent(batch)}/codes.csv`} download>
                        Télécharger
                      </a>
                    )}
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
