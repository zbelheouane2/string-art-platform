"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NAMES: Record<string, string> = { fr: "Français", en: "English", ar: "العربية" };

/** Menu déroulant de langue de l'en-tête (comme le sélecteur de la référence). */
export function LanguageMenu() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);

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

  return (
    <details ref={ref} className="lang-menu">
      <summary aria-label={`${t("language")} : ${NAMES[locale]}`}>
        <span lang={locale}>{NAMES[locale]}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <ul>
        {routing.locales.map((l) => (
          <li key={l}>
            <Link href={pathname} locale={l} lang={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
              {NAMES[l]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
