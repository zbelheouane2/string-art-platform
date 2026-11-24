import { LOCALES, LOCALE_FR } from "@/lib/contentTools";

/** Trois champs (français, arabe, anglais) pour un même texte. */
export function Texts3({ prefix, values, placeholders, long = false, max = 300 }: { prefix: string; values?: Record<string, string>; placeholders?: Record<string, string>; long?: boolean; max?: number }) {
  return (
    <div className="a-text-cols">
      {LOCALES.map((l) => {
        const id = `${prefix}_${l}`;
        const Tag = long ? "textarea" : "input";
        return (
          <label key={l} htmlFor={id}>
            <span>{LOCALE_FR[l]}</span>
            <Tag id={id} name={id} className="a-input" defaultValue={values?.[l] ?? ""} placeholder={placeholders?.[l]} dir={l === "ar" ? "rtl" : "ltr"} lang={l} maxLength={max} {...(long ? { rows: 3 } : {})} />
          </label>
        );
      })}
    </div>
  );
}
