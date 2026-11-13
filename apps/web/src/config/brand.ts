/**
 * Identité de marque. Nom validé (décision D9) : « DeeKra », qui évoque ذكرى
 * (« souvenir »). Le nom reste réglable par variable d'environnement ; le logo
 * calligraphié (visuels/marque) s'écrit « Deekra ».
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "DeeKra",
  logo: { light: "/visuels/marque/deekra-entete.webp", dark: "/visuels/marque/deekra-entete-sombre.webp", width: 623, height: 320 },
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
} as const;
