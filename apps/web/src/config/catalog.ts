/**
 * Offre affichée sur la page d'accueil. Les prix ne sont pas encore validés :
 * tant qu'ils valent null, le site affiche « Prix bientôt disponible » et
 * le bouton d'achat n'est pas actif. Ils viendront ensuite de la base (table Price).
 */
export const kitOffer = {
  slug: "kit-portrait-50",
  price: null as null | { amountMinor: number; currency: string },
};
