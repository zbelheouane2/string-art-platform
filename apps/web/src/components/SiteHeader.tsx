"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CloseIcon, MenuIcon } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

const LINKS = [
  { href: { pathname: "/", hash: "acheter" }, key: "kit" },
  { href: { pathname: "/kit" }, key: "kitPage" },
  { href: { pathname: "/", hash: "comment" }, key: "how" },
  { href: { pathname: "/", hash: "cadeaux" }, key: "gift" },
  { href: { pathname: "/", hash: "faq" }, key: "faq" },
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
      <div className="wrap header-row">
        <div className="header-start">
          <button
            type="button"
            className="icon-btn"
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        <Link href="/" className="header-logo">
          <Logo />
        </Link>
        <div className="header-end">
          <LanguageMenu />
          <Link className="icon-btn" href={{ pathname: "/", hash: "acheter" }} aria-label={t("cart")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </Link>
        </div>
      </div>
      {open && (
        <nav id="nav-drawer" className="nav-drawer" aria-label={t("menu")}>
          <ul className="wrap">
            {LINKS.map((l) => (
              <li key={l.key}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="wrap drawer-lang">
            <LanguageSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
