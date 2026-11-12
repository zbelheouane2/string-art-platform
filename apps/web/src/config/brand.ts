/**
 * Identité de marque. Le nom définitif n'est pas encore choisi (décision D9) :
 * il se règle par variable d'environnement, sans toucher au code.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Studio Fil",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
} as const;
