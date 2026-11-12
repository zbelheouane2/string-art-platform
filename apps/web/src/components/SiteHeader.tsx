"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { brand } from "@/config/brand";
import { CloseIcon, MenuIcon } from "./Icons";
import { LanguageSwitcher } from "./LanguageSwitcher";

const LINKS = [
  { href: "#how", key: "how" },
  { href: "#kit", key: "kit" },
  { href: "#gift", key: "gift" },
  { href: "#faq", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap">
        <div className="header-start">
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link href="/" className="wordmark">
            {brand.name}
          </Link>
        </div>
        <nav className="main-nav" aria-label={t("menu")}>
          <ul>
            {LINKS.map((l) => (
              <li key={l.key}>
                <a href={l.href}>{t(l.key)}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-end">
          <LanguageSwitcher />
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <ul className="wrap">
            {LINKS.map((l) => (
              <li key={l.key}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {t(l.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
