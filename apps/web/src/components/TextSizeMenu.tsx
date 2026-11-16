"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TEXT_SIZES, TEXT_SIZE_KEY, applyTextSize, readTextSize } from "@/lib/textSize";

/**
 * Taille du texte de tout le site (en plus du zoom du navigateur) : le contenu
 * grossit et passe à la ligne, sans défilement sur les côtés. Choix gardé sur
 * l'appareil ; appliqué avant l'affichage par le script de la mise en page.
 */
export function TextSizeMenu({ inline = false }: { inline?: boolean }) {
  const t = useTranslations("nav");
  const ref = useRef<HTMLDetailsElement>(null);
  const [size, setSize] = useState<number>(100);

  useEffect(() => setSize(readTextSize()), []);

  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  const choose = (v: number) => {
    setSize(v);
    applyTextSize(v);
    try {
      localStorage.setItem(TEXT_SIZE_KEY, String(v));
    } catch {
      /* stockage indisponible : réglage gardé le temps de la page */
    }
    if (ref.current) ref.current.open = false;
  };

  const options = TEXT_SIZES.map((s) => (
    <button key={s.value} type="button" data-text-size={s.value} aria-pressed={size === s.value} onClick={() => choose(s.value)} style={inline ? undefined : { fontSize: `${s.value}%` }}>
      {inline ? <span aria-hidden="true" style={{ fontSize: `${s.value}%` }}>A</span> : null}
      {inline ? <span className="visually-hidden">{t(`textSizes.${s.key}`)}</span> : t(`textSizes.${s.key}`)}
    </button>
  ));

  if (inline) {
    // Menu du téléphone : quatre boutons A de tailles croissantes.
    return (
      <div className="text-size-row" role="group" aria-label={t("textSize")}>
        <span aria-hidden="true">{t("textSize")}</span>
        <div>{options}</div>
      </div>
    );
  }

  return (
    <details ref={ref} className="lang-menu text-menu">
      <summary aria-label={t("textSize")} title={t("textSize")}>
        <span aria-hidden="true" className="text-menu-icon">
          A<span>A</span>
        </span>
      </summary>
      <ul>
        {options.map((o) => (
          <li key={o.key}>{o}</li>
        ))}
      </ul>
    </details>
  );
}
