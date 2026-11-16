/**
 * Identité de marque. Nom validé (décision D9) : « DeeKra », qui évoque ذكرى
 * (« souvenir »). Le nom reste réglable par variable d'environnement ; le logo
 * calligraphié (visuels/marque) s'écrit « Deekra ».
 *
 * Contacts, réseaux et mentions légales : tout se règle par variable
 * d'environnement. Un champ vide n'est pas affiché sur le site.
 */
/** Les variables sont écrites en toutes lettres : Next.js ne remplace que celles-là. */
const env = (value: string | undefined, fallback = "") => (value ?? fallback).trim();

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "DeeKra",
  logo: { light: "/visuels/marque/deekra-entete.webp", dark: "/visuels/marque/deekra-entete-sombre.webp", width: 623, height: 320 },
  supportEmail: env(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  /** Numéro WhatsApp du service client, format international sans « + » (ex. 213771704033). */
  whatsapp: env(process.env.NEXT_PUBLIC_WHATSAPP, "213771704033"),
  /** Liens des réseaux sociaux : vides tant que les comptes n'existent pas. */
  social: {
    instagram: env(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
    facebook: env(process.env.NEXT_PUBLIC_FACEBOOK_URL),
    tiktok: env(process.env.NEXT_PUBLIC_TIKTOK_URL),
  },
  /**
   * Identité du vendeur, exigée par la loi n° 18-05 (commerce électronique) et
   * la loi n° 18-07 (données personnelles). À remplir avant l'ouverture.
   */
  legal: {
    company: env(process.env.NEXT_PUBLIC_LEGAL_COMPANY),
    address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
    rc: env(process.env.NEXT_PUBLIC_LEGAL_RC),
    nif: env(process.env.NEXT_PUBLIC_LEGAL_NIF),
    /** Numéro de récépissé de déclaration auprès de l'ANPDP. */
    anpdp: env(process.env.NEXT_PUBLIC_LEGAL_ANPDP),
  },
} as const;
