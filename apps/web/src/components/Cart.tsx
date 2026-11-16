"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { policies } from "@/config/policies";
import { formatPrice } from "@/lib/price";
import type { CartLines, ShopCatalog, ShopItem } from "@/lib/shopTypes";
import { CloseIcon } from "./Icons";

/**
 * Panier : stocké dans le navigateur (localStorage, aucune donnée personnelle),
 * partagé entre les onglets. Le tiroir latéral montre les articles, les quantités,
 * le total et mène à la commande. Les prix affichés viennent du serveur ;
 * la commande les recalcule de toute façon.
 */
const KEY = "dk-cart";
const EVENT = "dk-cart";
const EMPTY: CartLines = {};
let cache: { raw: string | null; lines: CartLines } = { raw: null, lines: EMPTY };

function read(): CartLines {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLines = EMPTY;
  try {
    const v = raw ? JSON.parse(raw) : {};
    if (v && typeof v === "object") lines = Object.fromEntries(Object.entries(v).filter(([s, q]) => /^[a-z0-9-]{1,40}$/.test(s) && Number.isInteger(q) && (q as number) > 0)) as CartLines;
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Stockage indisponible (navigation privée) : le panier vit le temps de la page.
    cache = { raw: JSON.stringify(lines), lines };
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

interface CartApi {
  catalog: ShopCatalog | null;
  lines: CartLines;
  /** Le panier a été lu (après le premier rendu côté navigateur). */
  ready: boolean;
  count: number;
  set: (slug: string, quantity: number) => void;
  /** Ajoute des articles (sans dépasser le maximum) puis ouvre le tiroir. */
  add: (items: Record<string, number>, open?: boolean) => void;
  replace: (lines: CartLines) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  items: { item: ShopItem; quantity: number }[];
  subtotal: number;
}

const Ctx = createContext<CartApi | null>(null);

export function useCart(): CartApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart hors de CartProvider");
  return c;
}

export function CartProvider({ catalog, children }: { catalog: ShopCatalog | null; children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setReady(true), []);
  const max = catalog?.maxQuantity ?? 5;
  const known = useMemo(() => (catalog ? [catalog.kit, ...catalog.accessories] : []), [catalog]);
  const clamp = useCallback((q: number) => Math.max(0, Math.min(max, Math.round(q))), [max]);

  const set = useCallback(
    (slug: string, quantity: number) => {
      const next = { ...read() };
      const q = clamp(quantity);
      if (q === 0) delete next[slug];
      else next[slug] = q;
      write(next);
    },
    [clamp],
  );
  const add = useCallback(
    (items: Record<string, number>, openAfter = true) => {
      const next = { ...read() };
      for (const [slug, q] of Object.entries(items)) next[slug] = clamp((next[slug] ?? 0) + q);
      write(next);
      if (openAfter) setOpen(true);
    },
    [clamp],
  );
  const replace = useCallback((l: CartLines) => write(l), []);

  const items = known.filter((i) => lines[i.slug]).map((item) => ({ item, quantity: lines[item.slug] }));
  const subtotal = items.reduce((s, { item, quantity }) => s + item.price.amountMinor * quantity, 0);
  const count = items.reduce((s, { quantity }) => s + quantity, 0);
  const api: CartApi = { catalog, lines, ready, count, set, add, replace, open, setOpen, items, subtotal };
  return (
    <Ctx.Provider value={api}>
      {children}
      <CartDrawer />
    </Ctx.Provider>
  );
}

/** Bouton panier de l'en-tête, avec le nombre d'articles. */
export function CartButton() {
  const t = useTranslations("cart");
  const { count, setOpen, ready } = useCart();
  return (
    <button type="button" className="icon-btn cart-btn" data-cart-open aria-haspopup="dialog" aria-label={t("open", { count: ready ? count : 0 })} onClick={() => setOpen(true)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {ready && count > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}

/** Sélecteur − quantité + (partagé par le tiroir et le récapitulatif de commande). */
export function QuantityStepper({ item, quantity, onChange, max }: { item: ShopItem; quantity: number; onChange: (q: number) => void; max: number }) {
  const t = useTranslations("cart");
  const locale = useLocale() as "fr" | "en" | "ar";
  const name = item.names[locale] ?? item.names.fr;
  return (
    <div className="qty" role="group" aria-label={t("quantityOf", { name })}>
      <button type="button" onClick={() => onChange(quantity - 1)} disabled={quantity <= 1} aria-label={t("decrease", { name })}>
        −
      </button>
      <output aria-live="polite">{quantity}</output>
      <button type="button" onClick={() => onChange(quantity + 1)} disabled={quantity >= max} aria-label={t("increase", { name })}>
        +
      </button>
    </div>
  );
}

function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale() as "fr" | "en" | "ar";
  const { open, setOpen, items, subtotal, count, set, catalog, add } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  if (!catalog) return null;
  const money = (amountMinor: number) => formatPrice({ amountMinor, currency: catalog.kit.price.currency }, locale);
  const missing = catalog.accessories.filter((a) => !items.some((i) => i.item.slug === a.slug));
  return (
    <dialog
      ref={ref}
      className="cart-drawer"
      aria-labelledby="cart-title"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="cart-panel">
        <header className="cart-head">
          <h2 id="cart-title">
            {t("title")}
            {count > 0 && <span className="cart-count">{count}</span>}
          </h2>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={t("close")}>
            <CloseIcon />
          </button>
        </header>
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>{t("empty")}</p>
            <button type="button" className="btn btn-primary" onClick={() => add({ [catalog.kit.slug]: 1 })}>
              {t("addKit")}
            </button>
          </div>
        ) : (
          <ul className="cart-lines">
            {items.map(({ item, quantity }) => (
              <li key={item.slug} className="cart-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumb} alt="" width={88} height={88} />
                <div className="cart-line-text">
                  <strong>{item.names[locale] ?? item.names.fr}</strong>
                  <span>{money(item.price.amountMinor)}</span>
                </div>
                <div className="cart-line-end">
                  <QuantityStepper item={item} quantity={quantity} onChange={(q) => set(item.slug, q)} max={catalog.maxQuantity} />
                  <button type="button" className="link-btn" onClick={() => set(item.slug, 0)}>
                    {t("remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 && missing.length > 0 && (
          <div className="cart-suggest">
            <p>{t("suggest")}</p>
            {missing.map((a) => (
              <button key={a.slug} type="button" className="cart-suggest-btn" onClick={() => add({ [a.slug]: 1 }, false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.thumb} alt="" width={40} height={40} />
                <span>{a.names[locale] ?? a.names.fr}</span>
                <b>+ {money(a.price.amountMinor)}</b>
              </button>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <footer className="cart-foot">
            <p className="cart-total">
              <span>{t("total")}</span>
              <strong>{money(subtotal)}</strong>
            </p>
            <p className="cart-note">{t("deliveryNote", { min: policies.deliveryDays.min, max: policies.deliveryDays.max })}</p>
            <Link href="/commander" className="btn btn-primary btn-lg btn-block cart-checkout" onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {t("checkout")}
            </Link>
          </footer>
        )}
      </div>
    </dialog>
  );
}
