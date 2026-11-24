import { z } from "zod";

/** Avis laissé depuis le site : prénom, lieu facultatif, note 1 à 5, texte. */
export const reviewSchema = z.object({
  name: z.string().trim().min(2).max(40),
  place: z.string().trim().max(60).optional().default(""),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(800),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/** Prénom seulement : « Amina Benali » → « Amina B. » (jamais le nom complet en ligne). */
export function displayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
