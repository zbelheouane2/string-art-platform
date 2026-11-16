/**
 * Avis clients affichés sur l'accueil. Vide tant qu'il n'y a pas de vrais avis :
 * la section ne s'affiche pas. N'ajouter que des avis réels, avec l'accord du client
 * (prénom et wilaya seulement, jamais le nom complet ni l'adresse).
 */
export interface Review {
  /** Prénom ou initiale, tel que le client accepte de l'afficher. */
  name: string;
  /** Wilaya ou pays, facultatif. */
  place?: string;
  /** Note sur 5, telle que donnée par le client. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Texte de l'avis, dans la langue où il a été écrit. */
  text: string;
  /** Photo du portrait terminé envoyée par le client (dans public/avis/), facultative. */
  photo?: string;
}

export const reviews: readonly Review[] = [];
