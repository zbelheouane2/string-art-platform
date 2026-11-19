import { analytics, analyticsEnabled } from "@/config/analytics";

/**
 * Mesure côté navigateur : consentement, chargement des outils et événements.
 * Rien n'est chargé ni envoyé sans accord explicite. Aucune donnée personnelle
 * (nom, téléphone, photo) n'est transmise : seulement la page vue, l'article,
 * le montant et le numéro de commande.
 */
export type Consent = "granted" | "denied" | null;
export type ShopEvent = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
export interface EventData {
  /** Montant en centimes (comme partout dans le site). */
  valueMinor?: number;
  currency?: string;
  items?: string[];
  /** Numéro de commande (achat uniquement). */
  orderId?: string;
}

const KEY = "dk-consent";
export const CONSENT_EVENT = "dk-consent";
/** Ouvre à nouveau le bandeau (lien « Cookies » du pied de page). */
export const CONSENT_OPEN_EVENT = "dk-consent-open";

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: "granted" | "denied") {
  const before = readConsent();
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Stockage indisponible : le choix vaut pour la page.
  }
  if (value === "granted") loadTools();
  else if (before === "granted") {
    // Retrait de l'accord : on efface les cookies de mesure et on recharge sans les outils.
    clearToolCookies();
    window.location.reload();
    return;
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function clearToolCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (!/^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_tt_)/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

type AnyFn = (...args: any[]) => void;
type ToolWindow = Window & { dataLayer?: unknown[]; gtag?: AnyFn; fbq?: AnyFn & Record<string, unknown>; _fbq?: unknown; ttq?: unknown[] & Record<string, unknown> };

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

let loaded = false;

/** Installe les outils configurés (files d'attente immédiates, scripts en asynchrone). */
export function loadTools() {
  if (loaded || !analyticsEnabled || typeof window === "undefined") return;
  loaded = true;
  const w = window as ToolWindow;

  if (analytics.ga4) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // gtag attend l'objet « arguments » tel quel.
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", analytics.ga4, { send_page_view: false });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${analytics.ga4}`);
  }

  if (analytics.metaPixel && !w.fbq) {
    // Code de base du pixel Meta.
    const n = function (...args: unknown[]) {
      const self = n as unknown as { callMethod?: AnyFn; queue: unknown[] };
      if (self.callMethod) self.callMethod(...args);
      else self.queue.push(args);
    } as AnyFn & Record<string, unknown>;
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    Object.assign(n, { push: n, loaded: true, version: "2.0", queue: [] });
    addScript("https://connect.facebook.net/en_US/fbevents.js");
    w.fbq("init", analytics.metaPixel);
  }

  if (analytics.tiktokPixel && !w.ttq) {
    // Code de base du pixel TikTok.
    const ttq = [] as unknown as unknown[] & Record<string, unknown>;
    w.ttq = ttq;
    const methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    const defer = (target: unknown[] & Record<string, unknown>, m: string) => {
      target[m] = (...args: unknown[]) => target.push([m, ...args]);
    };
    methods.forEach((m) => defer(ttq, m));
    const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = { [analytics.tiktokPixel]: Object.assign([], { _u: src }) };
    ttq._t = { [analytics.tiktokPixel]: Date.now() };
    ttq._o = { [analytics.tiktokPixel]: {} };
    addScript(`${src}?sdkid=${analytics.tiktokPixel}&lib=ttq`);
  }
}

/** Page vue (au chargement et à chaque changement de page). */
export function trackPageView(path: string) {
  if (!loaded) return;
  const w = window as ToolWindow;
  w.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
  w.fbq?.("track", "PageView");
  (w.ttq as unknown as { page?: AnyFn } | undefined)?.page?.();
}

const META: Record<ShopEvent, string> = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" };
const TIKTOK: Record<ShopEvent, string> = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "PlaceAnOrder" };

/** Événement de la boutique, envoyé aux outils chargés (rien sans consentement). */
export function track(event: ShopEvent, data: EventData = {}) {
  if (!loaded) return;
  const w = window as ToolWindow;
  const value = data.valueMinor !== undefined ? data.valueMinor / 100 : undefined;
  const items = data.items ?? [];
  w.gtag?.("event", event, {
    value,
    currency: data.currency,
    ...(data.orderId ? { transaction_id: data.orderId } : {}),
    items: items.map((id) => ({ item_id: id })),
  });
  w.fbq?.("track", META[event], { value, currency: data.currency, content_ids: items, content_type: "product" }, data.orderId ? { eventID: data.orderId } : undefined);
  (w.ttq as unknown as { track?: AnyFn } | undefined)?.track?.(TIKTOK[event], {
    value,
    currency: data.currency,
    contents: items.map((id) => ({ content_id: id, content_type: "product" })),
  });
}

/** Achat compté une seule fois par appareil (recharger la confirmation ne recompte pas). */
export function trackPurchaseOnce(data: EventData & { orderId: string }) {
  if (!loaded) return;
  const key = `dk-tracked-${data.orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // Sans stockage, on envoie quand même (pas de doublon possible dans la même page).
  }
  track("purchase", data);
}
