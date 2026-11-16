"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CartButton } from "./Cart";
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
  { href: { pathname: "/livraison" }, key: "delivery" },
  { href: { pathname: "/suivi" }, key: "track" },
  { href: { pathname: "/contact" }, key: "contact" },
  { href: { pathname: "/activer" }, key: "code" },
  { href: { pathname: "/guide/demo" }, key: "guideDemo" },
] as const;

/** Menu horizontal (ordinateur), sur une ligne sous le logo, comme une boutique classique. */
const BAR = [
  { href: { pathname: "/kit" }, key: "kit" },
  { href: { pathname: "/", hash: "comment" }, key: "how" },
  { href: { pathname: "/", hash: "cadeaux" }, key: "gift" },
  { href: { pathname: "/", hash: "faq" }, key: "faq" },
  { href: { pathname: "/livraison" }, key: "delivery" },
  { href: { pathname: "/contact" }, key: "contact" },
  { href: { pathname: "/suivi" }, key: "track" },
  { href: { pathname: "/activer" }, key: "code" },
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
          <CartButton />
        </div>
      </div>
      <nav className="header-nav" aria-label={t("main")}>
        <ul className="wrap">
          {BAR.map((l) => (
            <li key={l.key}>
              <Link href={l.href}>{t(l.key)}</Link>
            </li>
          ))}
        </ul>
      </nav>
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
