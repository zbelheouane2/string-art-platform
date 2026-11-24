import { requireAdmin } from "@/lib/admin/auth";
import { INDEXED_PATHS } from "@/config/site";
import { LOCALES, LOCALE_FR } from "@/lib/contentTools";
import { getSetting } from "@/lib/settings";
import { saveSeoAction } from "../_actions/content";
import { AdminShell, Flash } from "../AdminShell";

export const dynamic = "force-dynamic";

const PAGE_FR: Record<string, string> = {
  "/": "Accueil",
  "/kit": "Fiche du kit",
  "/numerique": "Offre numérique",
  "/contact": "Contact",
  "/livraison": "Livraison",
  "/retours": "Retours",
  "/confidentialite": "Confidentialité",
  "/conditions": "Conditions de vente",
};

/** Titre et description que Google affiche pour chaque page, par langue. */
export default async function SeoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin("seo");
  const q = await searchParams;
  const seo = await getSetting("seo");
  return (
    <AdminShell
      title="Référencement Google"
      current="/admin/referencement"
      lead="Le titre (60 caractères environ) et la description (155 caractères environ) que Google montre dans ses résultats. Laissez vide pour garder ceux calculés à partir des textes de la page."
    >
      <Flash ok={q.ok} error={q.erreur} />
      <form action={saveSeoAction} className="a-stack">
        {INDEXED_PATHS.map((p) => {
          const key = p || "/";
          return (
            <fieldset key={key} className="a-card a-seo">
              <legend>
                <strong>{PAGE_FR[key] ?? key}</strong> <code className="a-muted">{key}</code>
              </legend>
              <div className="a-text-cols">
                {LOCALES.map((l) => (
                  <div key={l} className="a-stack" dir={l === "ar" ? "rtl" : "ltr"}>
                    <label className="a-field">
                      <span>Titre · {LOCALE_FR[l]}</span>
                      <input name={`title_${key}_${l}`} className="a-input" maxLength={70} defaultValue={seo[key]?.[l]?.title ?? ""} lang={l} />
                    </label>
                    <label className="a-field">
                      <span>Description · {LOCALE_FR[l]}</span>
                      <textarea name={`desc_${key}_${l}`} className="a-input" rows={3} maxLength={170} defaultValue={seo[key]?.[l]?.description ?? ""} lang={l} />
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          );
        })}
        <div className="a-sticky-btn">
          <button type="submit" className="a-btn">
            Enregistrer le référencement
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
