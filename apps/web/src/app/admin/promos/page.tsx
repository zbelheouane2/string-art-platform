import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { createPromoAction, togglePromoAction } from "../actions";
import { AdminShell, Flash, da, dateFr } from "../AdminShell";

export const dynamic = "force-dynamic";

const SCOPE = { KIT: "le kit seul", ORDER: "tous les articles", SHIPPING: "la livraison" } as const;

export default async function PromosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const q = await searchParams;
  const promos = await db().promoCode.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <AdminShell title="Codes promo" current="/admin/promos">
      <Flash ok={q.ok} error={q.erreur} />
      <details className="a-card" open={promos.length === 0}>
        <summary className="a-summary">Créer un code</summary>
        <form action={createPromoAction} className="a-grid">
          <label>
            Code
            <input name="code" className="a-input" required placeholder="BIENVENUE10" autoCapitalize="characters" maxLength={30} />
          </label>
          <label>
            Type de remise
            <select name="kind" className="a-input" defaultValue="PERCENT">
              <option value="PERCENT">Pourcentage (%)</option>
              <option value="FIXED">Montant fixe (DA)</option>
            </select>
          </label>
          <label>
            Valeur (% ou DA)
            <input name="value" className="a-input" required inputMode="numeric" placeholder="10" />
          </label>
          <label>
            Porte sur
            <select name="scope" className="a-input" defaultValue="ORDER">
              <option value="ORDER">Tous les articles</option>
              <option value="KIT">Le kit seul</option>
              <option value="SHIPPING">La livraison (100 % = offerte)</option>
            </select>
          </label>
          <label>
            Minimum d&apos;articles (DA, facultatif)
            <input name="minOrder" className="a-input" inputMode="numeric" placeholder="5000" />
          </label>
          <label>
            Début (facultatif)
            <input name="startsAt" type="date" className="a-input" />
          </label>
          <label>
            Fin (facultatif)
            <input name="endsAt" type="date" className="a-input" />
          </label>
          <label>
            Utilisations au total (facultatif)
            <input name="maxUses" className="a-input" inputMode="numeric" placeholder="100" />
          </label>
          <label>
            Utilisations par client (facultatif)
            <input name="maxUsesPerPhone" className="a-input" inputMode="numeric" placeholder="1" />
          </label>
          <label className="a-span">
            Note interne (facultatif, jamais montrée au client)
            <input name="note" className="a-input" maxLength={200} placeholder="Campagne Instagram de novembre" />
          </label>
          <button type="submit" className="a-btn">
            Créer le code
          </button>
        </form>
      </details>

      {promos.length === 0 ? (
        <p className="a-muted">Aucun code pour l&apos;instant.</p>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table a-table-cards">
            <thead>
              <tr>
                <th>Code</th>
                <th>Remise</th>
                <th>Conditions</th>
                <th>Utilisations</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => {
                const expired = (p.endsAt && p.endsAt < now) || (p.maxUses !== null && p.uses >= p.maxUses);
                const upcoming = p.startsAt && p.startsAt > now;
                return (
                  <tr key={p.id}>
                    <td data-label="Code">
                      <strong>{p.code}</strong>
                      {p.note && <span className="a-tag">{p.note}</span>}
                    </td>
                    <td data-label="Remise">
                      {p.kind === "PERCENT" ? `${p.value} %` : da(p.value)} sur {SCOPE[p.scope]}
                    </td>
                    <td className="a-small" data-label="Conditions">
                      {p.minOrderMinor !== null && <div>Dès {da(p.minOrderMinor)} d&apos;articles</div>}
                      {(p.startsAt || p.endsAt) && (
                        <div>
                          {p.startsAt ? `Du ${dateFr(p.startsAt)}` : "Dès maintenant"} {p.endsAt ? `au ${dateFr(p.endsAt)}` : ""}
                        </div>
                      )}
                      {p.maxUsesPerPhone !== null && <div>{p.maxUsesPerPhone} fois par client</div>}
                      {p.minOrderMinor === null && !p.startsAt && !p.endsAt && p.maxUsesPerPhone === null && <span className="a-muted">aucune</span>}
                    </td>
                    <td data-label="Utilisations">
                      {p.uses}
                      {p.maxUses !== null && ` / ${p.maxUses}`}
                    </td>
                    <td data-label="État">
                      <form action={togglePromoAction} className="a-inline">
                        <input type="hidden" name="code" value={p.code} />
                        <span className={`a-pill ${p.active && !expired && !upcoming ? "a-pill-on" : ""}`}>
                          {!p.active ? "Désactivé" : expired ? "Terminé" : upcoming ? "À venir" : "Actif"}
                        </span>
                        <button type="submit" className="a-btn a-btn-sm a-btn-ghost">
                          {p.active ? "Désactiver" : "Activer"}
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
