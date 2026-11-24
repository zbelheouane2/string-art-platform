import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { textRows } from "@/lib/admin/textRows";
import { CONTENT_SECTIONS } from "@/lib/contentTools";
import { db } from "@/lib/db";
import { saveTextsAction } from "../_actions/content";
import { AdminShell, Flash } from "../AdminShell";
import { TextRows } from "../_ui/TextRows";

export const dynamic = "force-dynamic";

/** Tous les textes du site, par rubrique, en français, arabe et anglais. */
export default async function TextsPage({ searchParams }: { searchParams: Promise<{ rubrique?: string; ok?: string; erreur?: string }> }) {
  await requireAdmin("content");
  const q = await searchParams;
  const section = CONTENT_SECTIONS.find((s) => s.ns === q.rubrique);
  const counts = await db().contentOverride.groupBy({ by: ["key"], _count: true });
  const editedNs = new Map<string, number>();
  for (const c of counts) {
    const ns = c.key.split(".")[0];
    editedNs.set(ns, (editedNs.get(ns) ?? 0) + 1);
  }
  return (
    <AdminShell
      title="Textes du site"
      current="/admin/textes"
      lead="Modifiez n'importe quel texte du site, dans les trois langues. Un champ vidé reprend le texte d'origine. Les mots entre accolades, comme {brand} ou {count}, sont remplacés automatiquement : gardez-les."
    >
      <Flash ok={q.ok} error={q.erreur} />
      <nav className="a-filters a-sections" aria-label="Rubriques">
        {CONTENT_SECTIONS.map((s) => (
          <Link key={s.ns} href={`/admin/textes?rubrique=${s.ns}`} aria-current={section?.ns === s.ns ? "page" : undefined}>
            {s.label}
            {editedNs.get(s.ns) ? <span className="a-count">{editedNs.get(s.ns)}</span> : null}
          </Link>
        ))}
      </nav>
      {section ? (
        <form action={saveTextsAction} className="a-card">
          <input type="hidden" name="ns" value={section.ns} />
          <div className="a-card-head">
            <h2>{section.label}</h2>
            <button type="submit" className="a-btn">
              Enregistrer
            </button>
          </div>
          <TextRows rows={await textRows(section.ns)} ns={section.ns} />
          <div className="a-sticky-btn">
            <button type="submit" className="a-btn">
              Enregistrer les textes
            </button>
          </div>
        </form>
      ) : (
        <p className="a-muted">Choisissez une rubrique ci-dessus.</p>
      )}
    </AdminShell>
  );
}
