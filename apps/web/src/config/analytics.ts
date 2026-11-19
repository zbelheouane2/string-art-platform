/**
 * Mesure d'audience et pixels publicitaires. Chaque identifiant se règle par
 * variable d'environnement ; vide = l'outil n'est pas chargé. Sans aucun
 * identifiant, ni script ni bandeau de consentement n'apparaît.
 *
 * Les scripts ne se chargent qu'après l'accord du visiteur (loi 18-07, RGPD
 * pour les visiteurs européens) : voir components/Analytics.tsx.
 */
const pick = (value: string | undefined, pattern: RegExp) => {
  const v = (value ?? "").trim();
  return pattern.test(v) ? v : "";
};

export const analytics = {
  /** Google Analytics 4 : « G-XXXXXXXXXX ». */
  ga4: pick(process.env.NEXT_PUBLIC_GA4_ID, /^G-[A-Z0-9]{4,20}$/),
  /** Pixel Meta (Facebook, Instagram) : identifiant numérique. */
  metaPixel: pick(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{5,20}$/),
  /** Pixel TikTok : identifiant alphanumérique. */
  tiktokPixel: pick(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID, /^[A-Z0-9]{10,30}$/),
};

export const analyticsEnabled = Boolean(analytics.ga4 || analytics.metaPixel || analytics.tiktokPixel);
