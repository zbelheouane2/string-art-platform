/**
 * Droits de l'espace admin par rôle. Un seul endroit décide qui voit quoi :
 * le menu, chaque page et chaque action s'appuient sur cette table.
 *
 * Partage validé avec le propriétaire (24/11/2026) :
 * - l'employé traite les commandes, le stock, les avis, l'annonce et la FAQ ;
 * - le reste (prix, promos, livraison, textes, photos, référencement,
 *   statistiques, clients, exports, comptes, réglages) est réservé à l'administrateur.
 */
export type AdminRole = "ADMIN" | "EMPLOYEE";

export const PERMISSIONS = {
  dashboard: ["ADMIN", "EMPLOYEE"],
  orders: ["ADMIN", "EMPLOYEE"],
  stock: ["ADMIN", "EMPLOYEE"],
  reviews: ["ADMIN", "EMPLOYEE"],
  announcement: ["ADMIN", "EMPLOYEE"],
  faq: ["ADMIN", "EMPLOYEE"],
  ordersExport: ["ADMIN"],
  customers: ["ADMIN"],
  stats: ["ADMIN"],
  prices: ["ADMIN"],
  promos: ["ADMIN"],
  delivery: ["ADMIN"],
  codes: ["ADMIN"],
  content: ["ADMIN"],
  media: ["ADMIN"],
  seo: ["ADMIN"],
  contacts: ["ADMIN"],
  users: ["ADMIN"],
  settings: ["ADMIN"],
  journal: ["ADMIN"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AdminRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly AdminRole[]).includes(role);
}

export const ROLE_FR: Record<AdminRole, string> = { ADMIN: "Administrateur", EMPLOYEE: "Employé" };

/** Ce que voit l'employé, en phrases simples (page des comptes). */
export const EMPLOYEE_SCOPE_FR = [
  "Voir et traiter les commandes : confirmer par WhatsApp, changer l'état, préparer l'envoi",
  "Marquer le stock et les ruptures",
  "Valider ou refuser les avis clients",
  "Modifier l'annonce en haut du site et la FAQ",
];
export const ADMIN_ONLY_FR = [
  "Prix, codes promo et tarifs de livraison",
  "Textes, photos et référencement des pages",
  "Statistiques de ventes, liste et export des clients",
  "Comptes, réglages et liaison Google Sheets",
];
