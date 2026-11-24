import { requireAdmin } from "@/lib/admin/auth";
import { textRows } from "@/lib/admin/textRows";
import { getSetting } from "@/lib/settings";
import { FAQ_KEYS } from "@/components/FaqList";
import { addFaqAction, moveFaqAction, saveFaqTextsAction } from "../_actions/content";
import { AdminShell, Flash } from "../AdminShell";
import { Texts3 } from "../_ui/Texts3";
import { TextRows } from "../_ui/TextRows";

export const dynamic = "force-dynamic";

/** FAQ de l'accueil et de la fiche du kit : modifier, masquer, ajouter et ordonner les questions. */
export default async function FaqPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("faq");
  const q = await searchParams;
  const faq = await getSetting("faq");
  const rows = await textRows("faq");
  const head = rows.filter((r) => !r.key.startsWith("faq.items."));
  return (
    <AdminShell title="FAQ" current="/admin/faq" lead="Les questions fréquentes affichées sur l'accueil et sur la fiche du kit, dans les trois langues.">
      <Flash ok={q.ok} error={q.erreur} />
      <form action={saveFaqTextsAction} className="a-card a-stack">
        <h2>Titre et introduction</h2>
        <TextRows rows={head} ns="faq" />
        <h2>Questions d&apos;origine</h2>
        {FAQ_KEYS.map((k, i) => (
          <fieldset key={k} className="a-faq-item">
            <legend>
              Question {i + 1}{" "}
              <label className="a-check-inline a-small">
                <input type="checkbox" name="hidden" value={k} defaultChecked={faq.hidden.includes(k)} /> masquer sur le site
              </label>
            </legend>
            <TextRows rows={rows.filter((r) => r.key.startsWith(`faq.items.${k}.`))} ns={`faq.items.${k}`} />
          </fieldset>
        ))}
        {faq.extra.length > 0 && <h2>Questions ajoutées</h2>}
        {faq.extra.map((e, i) => (
          <fieldset key={e.id} className="a-faq-item">
            <legend>Question ajoutée {i + 1}</legend>
            <p className="a-small a-muted">Question</p>
            <Texts3 prefix={`xq_${e.id}`} values={e.q} />
            <p className="a-small a-muted">Réponse</p>
            <Texts3 prefix={`xa_${e.id}`} values={e.a} long max={1500} />
          </fieldset>
        ))}
        <div className="a-sticky-btn">
          <button type="submit" className="a-btn">
            Enregistrer la FAQ
          </button>
        </div>
      </form>
      {faq.extra.length > 0 && (
        <section className="a-card">
          <h2>Ordre des questions ajoutées</h2>
          <ul className="a-sched">
            {faq.extra.map((e, i) => (
              <li key={e.id}>
                <span>{e.q.fr}</span>
                <div className="a-actions">
                  {(["up", "down", "delete"] as const).map((op) =>
                    (op === "up" && i === 0) || (op === "down" && i === faq.extra.length - 1) ? null : (
                      <form key={op} action={moveFaqAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="op" value={op} />
                        <button type="submit" className="a-btn a-btn-sm a-btn-ghost" aria-label={`${op === "up" ? "Monter" : op === "down" ? "Descendre" : "Supprimer"} : ${e.q.fr}`}>
                          {op === "up" ? "↑" : op === "down" ? "↓" : "Supprimer"}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <form action={addFaqAction} className="a-card a-stack">
        <h2>Ajouter une question</h2>
        <p className="a-small a-muted">Question</p>
        <Texts3 prefix="nq" />
        <p className="a-small a-muted">Réponse</p>
        <Texts3 prefix="na" long max={1500} />
        <div>
          <button type="submit" className="a-btn">
            Ajouter
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
