/** Pages d'information : clé de traduction (legal.<clé>, footer.infoLinks.<clé>) et adresse. */
export const INFO_PAGES = {
  delivery: "/livraison",
  returns: "/retours",
  privacy: "/confidentialite",
  terms: "/conditions",
} as const;
export type InfoPageKey = keyof typeof INFO_PAGES;
