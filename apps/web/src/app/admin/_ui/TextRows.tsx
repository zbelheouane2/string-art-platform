import { LOCALES, LOCALE_FR } from "@/lib/contentTools";

export interface TextRow {
  key: string;
  original: Record<string, string>;
  current: Record<string, string>;
}

/** Libellé lisible d'une clé (« faq.items.who.q » → « items › who › q »). */
const pretty = (key: string, ns: string) => key.slice(ns.length + 1).split(".").join(" › ") || key;

/**
 * Lignes d'édition d'une rubrique : une carte par texte, avec français, arabe
 * (de droite à gauche) et anglais. Champ vidé = texte d'origine.
 */
export function TextRows({ rows, ns }: { rows: TextRow[]; ns: string }) {
  return (
    <div className="a-texts">
      {rows.map((r) => {
        const edited = LOCALES.some((l) => r.current[l] !== r.original[l]);
        const long = Math.max(...LOCALES.map((l) => (r.original[l] ?? "").length)) > 90;
        return (
          <fieldset key={r.key} className="a-text-row">
            <legend>
              <code>{pretty(r.key, ns)}</code> {edited && <span className="a-pill a-pill-on">modifié</span>}
            </legend>
            <div className="a-text-cols">
              {LOCALES.map((l) => {
                const id = `t_${l}_${r.key}`;
                const Tag = long ? "textarea" : "input";
                return (
                  <label key={l} htmlFor={id}>
                    <span>{LOCALE_FR[l]}</span>
                    <Tag id={id} name={id} className="a-input" defaultValue={r.current[l] ?? ""} placeholder={r.original[l]} dir={l === "ar" ? "rtl" : "ltr"} lang={l} {...(long ? { rows: 3 } : {})} />
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
