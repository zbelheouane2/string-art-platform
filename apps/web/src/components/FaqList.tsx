import { getTranslations } from "next-intl/server";
import { getSetting } from "@/lib/settings";
import { PlusIcon } from "./Icons";

/** Questions d'origine du site, dans l'ordre d'affichage. */
export const FAQ_KEYS = ["who", "skills", "photo", "time", "privacy", "payment"] as const;

/** Liste de la FAQ : questions d'origine (sauf celles masquées dans l'admin) puis questions ajoutées. */
export async function FaqList({ locale }: { locale: string }) {
  const t = await getTranslations("faq");
  const faq = await getSetting("faq");
  const l = (["fr", "en", "ar"].includes(locale) ? locale : "fr") as "fr" | "en" | "ar";
  const items = [
    ...FAQ_KEYS.filter((k) => !faq.hidden.includes(k)).map((k) => ({ id: k, q: t(`items.${k}.q`), a: t(`items.${k}.a`) })),
    ...faq.extra.map((e) => ({ id: e.id, q: e.q[l] || e.q.fr, a: e.a[l] || e.a.fr })).filter((e) => e.q && e.a),
  ];
  return (
    <>
      {items.map((it) => (
        <details key={it.id}>
          <summary>
            {it.q}
            <PlusIcon />
          </summary>
          <p>{it.a}</p>
        </details>
      ))}
    </>
  );
}
