import { brand } from "@/config/brand";

/** Lien WhatsApp (wa.me) avec message prérempli facultatif ; null si aucun numéro. */
export function whatsappUrl(number: string = brand.whatsapp, text?: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Numéro algérien lisible : 213771704033 → 0771 70 40 33. Autres pays : +indicatif. */
export function displayPhone(number: string = brand.whatsapp): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("213") && digits.length === 12) {
    const local = `0${digits.slice(3)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
  }
  return digits ? `+${digits}` : "";
}

/** Réseaux sociaux renseignés, dans l'ordre d'affichage. */
export function socialLinks(social: Record<string, string> = brand.social): { key: string; url: string }[] {
  return Object.entries(social)
    .filter(([, url]) => /^https:\/\//.test(url))
    .map(([key, url]) => ({ key, url }));
}

/** Isole un numéro de gauche à droite dans une phrase arabe (U+2066 … U+2069). */
export const ltr = (text: string) => (text ? `\u2066${text}\u2069` : "");
