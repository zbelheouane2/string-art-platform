/**
 * Engagements affichés au client (livraison, retours). Valeurs centralisées ici
 * pour que la fiche du kit et les pages d'information disent toujours la même
 * chose. Toute modification doit être validée par le propriétaire.
 */
export const policies = {
  /** Délai indicatif de livraison, en jours ouvrables après confirmation téléphonique. */
  deliveryDays: { min: 2, max: 5 },
  /** Délai pour signaler un kit abîmé, incomplet ou non conforme (loi 18-05, art. 23). */
  reportDays: 4,
  /** Délai de remboursement quand l'échange est impossible (loi 18-05, art. 23). */
  refundDays: 15,
  /** Date de dernière mise à jour des pages d'information (AAAA-MM-JJ). */
  updated: "2026-11-16",
} as const;
