import { commerce } from "@/config/commerce";

/** Frais par mode de livraison puis par wilaya, en centimes (tels que saisis dans l'admin). */
export type RateTable = Record<string, Record<string, number>>;

/** La société ne livre pas cette wilaya avec ce mode. */
export const NOT_SERVED = "notServed" as const;

/**
 * Frais de livraison d'une wilaya pour un mode (domicile ou bureau d'une société).
 * - tarif saisi : son montant ;
 * - le mode a une grille saisie, mais pas cette wilaya : non desservie
 *   (ex. wilaya absente de la grille du transporteur) ;
 * - aucune grille saisie pour ce mode : `commerce.missingRateFeeMinor`
 *   (en attendant que le propriétaire importe les tarifs).
 */
export function deliveryFee(rates: RateTable, mode: string, wilaya: string): number | null | typeof NOT_SERVED {
  const grid = rates[mode];
  if (grid && Object.keys(grid).length > 0) return grid[wilaya] ?? NOT_SERVED;
  return commerce.missingRateFeeMinor;
}
