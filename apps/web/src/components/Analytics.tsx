"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { analyticsEnabled } from "@/config/analytics";
import { Link, usePathname } from "@/i18n/navigation";
import { CONSENT_EVENT, CONSENT_OPEN_EVENT, loadTools, readConsent, saveConsent, track, trackPageView, trackPurchaseOnce, type ShopEvent } from "@/lib/analytics";
import { useCart } from "./Cart";

/**
 * Mesure d'audience : bandeau de consentement (Accepter / Refuser, même poids),
 * chargement des outils après accord et page vue à chaque changement de page.
 * N'affiche rien si aucun outil n'est configuré.
 */
export function Analytics() {
  const t = useTranslations("consent");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;
    const sync = () => {
      const c = readConsent();
      setGranted(c === "granted");
      if (c === "granted") loadTools();
    };
    const c = readConsent();
    sync();
    setOpen(c === null);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    };
  }, []);

  useEffect(() => {
    if (granted) trackPageView(pathname);
  }, [granted, pathname]);

  if (!analyticsEnabled || !open) return null;
  const choose = (value: "granted" | "denied") => {
    setOpen(false);
    saveConsent(value);
  };
  return (
    <section className="consent" role="region" aria-label={t("title")}>
      <p>
        {t("text")} <Link href="/confidentialite">{t("privacy")}</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-outline" onClick={() => choose("denied")}>
          {t("refuse")}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => choose("granted")}>
          {t("accept")}
        </button>
      </div>
    </section>
  );
}

/** Lien « Cookies » du pied de page : rouvre le choix. Masqué sans outil configuré. */
export function ConsentSettingsButton() {
  const t = useTranslations("consent");
  if (!analyticsEnabled) return null;
  return (
    <button type="button" className="link-button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      {t("settings")}
    </button>
  );
}

/** Envoie un événement de la boutique une fois, à l'affichage de la page (après accord). */
export function TrackOnView({ event, value, currency, item, orderId }: { event: ShopEvent; value?: number; currency?: string; item?: string; orderId?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    const send = () => {
      if (sent.current || readConsent() !== "granted") return;
      sent.current = true;
      loadTools();
      const data = { valueMinor: value, currency, items: item ? [item] : undefined };
      if (event === "purchase" && orderId) trackPurchaseOnce({ ...data, orderId });
      else track(event, data);
    };
    send();
    // Si le visiteur accepte pendant qu'il est sur la page.
    window.addEventListener(CONSENT_EVENT, send);
    return () => window.removeEventListener(CONSENT_EVENT, send);
  }, [event, value, currency, item, orderId]);
  return null;
}

/** Début de commande : montant et articles du panier. */
export function TrackCheckout() {
  const { ready, items, subtotal } = useCart();
  const sent = useRef(false);
  useEffect(() => {
    if (!ready || sent.current || readConsent() !== "granted") return;
    sent.current = true;
    loadTools();
    const currency = items[0]?.item.price.currency;
    track("begin_checkout", { valueMinor: subtotal || undefined, currency, items: items.map((i) => i.item.slug) });
  }, [ready, items, subtotal]);
  return null;
}
