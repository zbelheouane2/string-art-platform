/**
 * Réglages du parcours client (codes, générations, commandes). Les prix, devises,
 * moyens de paiement et de livraison sont en base (tables Price, PaymentMethod,
 * DeliveryMethod) : rien de tout cela n'est écrit ici.
 */
export const commerce = {
  /** Marché utilisé tant que le visiteur ne peut pas en choisir un autre. */
  defaultMarket: process.env.DEFAULT_MARKET ?? "DZ",
  /** Produit vendu par le bouton « Commander ». */
  kitSlug: "kit-portrait-50",
  maxQuantity: 5,
  /**
   * Frais comptés quand aucun tarif n'est saisi dans l'admin pour la wilaya
   * et le mode choisis (choix du propriétaire : 0 en attendant les vrais tarifs).
   */
  missingRateFeeMinor: 0,
  /** Durée pendant laquelle un appareil garde le code ouvert. */
  codeSessionDays: 30,
  /** Anti force brute : essais de codes inconnus autorisés par appareil et par fenêtre. */
  codeAttempts: { max: 8, windowMinutes: 15 },
  /** Nombre de portraits qu'un code peut calculer avant d'en valider un. */
  maxGenerationsPerCode: 10,
  /** Conservation de la photo : elle n'est pas stockée (0 jour), seule son empreinte reste. */
  photoRetentionDays: 0,
  /**
   * Jours pendant lesquels un portrait terminé (dernier fil atteint) reste
   * consultable, avant l'effacement de ses instructions pour libérer la base.
   */
  finishedPortraitRetentionDays: 7,
  /** Taille maximale d'une photo envoyée. */
  maxPhotoBytes: 15 * 1024 * 1024,
  acceptedPhotoTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;
