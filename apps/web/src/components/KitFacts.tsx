import { getTranslations } from "next-intl/server";

/**
 * Repères rapides sous le prix du kit. Chiffres vérifiables : planche et clous
 * (géométrie du moteur), durée estimée d'après le nombre de fils calculés
 * (≈ 1 900 à 3 200) au rythme par défaut du guide (7 s par fil).
 */
const FACTS = [
  { key: "board", d: "M4 4h16v16H4z M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9" },
  { key: "time", d: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 7v5l3 2" },
  { key: "app", d: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M10 18h4" },
  { key: "voice", d: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3" },
] as const;

export async function KitFacts() {
  const t = await getTranslations("shop.facts");
  return (
    <ul className="kit-facts" aria-label={t("label")}>
      {FACTS.map((f) => (
        <li key={f.key}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={f.d} />
          </svg>
          <span>{t(f.key)}</span>
        </li>
      ))}
    </ul>
  );
}
