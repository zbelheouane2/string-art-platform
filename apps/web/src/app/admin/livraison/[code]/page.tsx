import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { currentRates } from "@/lib/shipping/saveRates";
import { WILAYAS } from "@/config/wilayas";
import { saveRatesTableAction, updateCarrierAction } from "../../actions";
import { AdminShell, Flash, dateFr } from "../../AdminShell";
import { RateImport } from "./RateImport";

export const dynamic = "force-dynamic";

export default async function CarrierPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const { code } = await params;
  const q = await searchParams;
  const carrier = await db().carrier.findUnique({ where: { code } });
  if (!carrier) notFound();
  const methods = await db().deliveryMethod.findMany({ where: { provider: code } });
  const home = methods.find((m) => m.code.endsWith("_home"))?.active ?? false;
  const desk = methods.find((m) => m.code.endsWith("_desk"))?.active ?? false;
  const rates = await currentRates(db(), code);
  const filled = [...rates.values()].filter((r) => r.home !== null || r.desk !== null).length;
  return (
    <AdminShell title={carrier.name} current="/admin/livraison">
      <p>
        <Link href="/admin/livraison">← Toutes les sociétés</Link>
      </p>
      <Flash ok={q.ok} error={q.erreur} />

      <section className="a-card">
        <h2>Réglages</h2>
        <form action={updateCarrierAction} className="a-grid">
          <input type="hidden" name="code" value={carrier.code} />
          <label>
            Nom affiché
            <input name="name" className="a-input" defaultValue={carrier.name} maxLength={60} />
          </label>
          <label>
            Logo (facultatif)
            <input name="logoUrl" className="a-input" defaultValue={carrier.logoUrl ?? ""} />
          </label>
          <fieldset className="a-span a-checks">
            <legend>Proposée aux clients</legend>
            <label>
              <input type="checkbox" name="active" defaultChecked={carrier.active} /> Société active
            </label>
            <label>
              <input type="checkbox" name="home" defaultChecked={home} /> Livraison à domicile
            </label>
            <label>
              <input type="checkbox" name="desk" defaultChecked={desk} /> Retrait au bureau
            </label>
          </fieldset>
          <button type="submit" className="a-btn">
            Enregistrer les réglages
          </button>
        </form>
      </section>

      <section className="a-card">
        <h2>Importer un fichier de tarifs</h2>
        <p className="a-muted">
          Quand {carrier.name} change ses prix : envoyez son fichier Excel (.xlsx) ou CSV avec trois colonnes <b>wilaya</b>, <b>domicile</b>, <b>bureau</b> (montants en DA). Vous verrez les changements avant de valider. Cellule vide = tarif supprimé (confirmé par téléphone).{" "}
          <a href={`/admin/livraison/${carrier.code}/tarifs.csv`}>Télécharger les tarifs actuels (modèle)</a>
        </p>
        <RateImport code={carrier.code} />
      </section>

      <section className="a-card">
        <h2>Tarifs par wilaya</h2>
        <p className="a-muted">
          {filled} wilayas sur {WILAYAS.length} ont un tarif · dernière mise à jour : {dateFr(carrier.ratesUpdatedAt)}
        </p>
        <form action={saveRatesTableAction}>
          <input type="hidden" name="code" value={carrier.code} />
          <div className="a-table-wrap a-rates">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Wilaya</th>
                  <th>Domicile (DA)</th>
                  <th>Bureau (DA)</th>
                </tr>
              </thead>
              <tbody>
                {WILAYAS.map((w) => {
                  const r = rates.get(w.code);
                  return (
                    <tr key={w.code}>
                      <td>
                        {w.code} - {w.fr}
                      </td>
                      <td>
                        <input name={`home_${w.code}`} className="a-input a-input-num" inputMode="numeric" defaultValue={r?.home ?? ""} aria-label={`Domicile, ${w.fr}`} />
                      </td>
                      <td>
                        <input name={`desk_${w.code}`} className="a-input a-input-num" inputMode="numeric" defaultValue={r?.desk ?? ""} aria-label={`Bureau, ${w.fr}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="submit" className="a-btn a-sticky-btn">
            Enregistrer le tableau
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
