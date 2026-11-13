"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NAMES: Record<string, { short: string; full: string }> = {
  fr: { short: "FR", full: "Français" },
  en: { short: "EN", full: "English" },
  ar: { short: "ع", full: "العربية" },
};

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t("language")} className="lang-switch">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          aria-label={`${NAMES[l].short} – ${NAMES[l].full}`}
          title={NAMES[l].full}
        >
          {NAMES[l].short}
        </Link>
      ))}
    </nav>
  );
}
