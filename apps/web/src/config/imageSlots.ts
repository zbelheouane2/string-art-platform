/**
 * Photos du site remplaçables depuis l'admin (rubrique Photos). Chaque
 * emplacement garde son image d'origine tant qu'aucune autre n'est choisie.
 */
export interface ImageSlot {
  slot: string;
  label: string;
  page: string;
  fallback: string;
}

const GIFTS: [string, string, string][] = [
  ["couples", "couple", "Couples"],
  ["parents", "haik", "Parents"],
  ["grandparents", "fillette", "Grands-parents"],
  ["pets", "chat", "Animaux"],
  ["memory", "benmhidi", "Mémoire"],
  ["self", "soi", "Pour soi"],
  ["occasion", "bebe", "Occasions"],
];

export const IMAGE_SLOTS: ImageSlot[] = [
  { slot: "home.medallion", label: "Médaillon du haut de page", page: "Accueil", fallback: "/visuels/caftan-photo.webp" },
  { slot: "home.intro", label: "Photo « Qu'est-ce que c'est »", page: "Accueil", fallback: "/visuels/etapes/accrocher.webp" },
  { slot: "home.transform.photo", label: "Avant / après rond : photo", page: "Accueil", fallback: "/visuels/couple-femme-photo.webp" },
  { slot: "home.transform.thread", label: "Avant / après rond : portrait en fil", page: "Accueil", fallback: "/visuels/couple-femme-fil.webp" },
  { slot: "home.kitCard", label: "Carte vers la fiche du kit", page: "Accueil", fallback: "/visuels/etapes/accrocher-mur.webp" },
  { slot: "home.final", label: "Portrait de l'appel final", page: "Accueil", fallback: "/visuels/dame-fil.webp" },
  ...GIFTS.flatMap(([key, name, label]): ImageSlot[] => [
    { slot: `gifts.${key}.photo`, label: `Idée cadeau « ${label} » : photo`, page: "Accueil", fallback: `/visuels/${name}-photo.webp` },
    { slot: `gifts.${key}.thread`, label: `Idée cadeau « ${label} » : portrait en fil`, page: "Accueil", fallback: `/visuels/${name}-fil.webp` },
  ]),
  { slot: "kit.check.photo", label: "Grand avant / après : photo", page: "Fiche du kit", fallback: "/visuels/boucles-photo.webp" },
  { slot: "kit.check.thread", label: "Grand avant / après : portrait en fil", page: "Fiche du kit", fallback: "/visuels/boucles-fil.webp" },
];

export const slotFallback = (slot: string) => IMAGE_SLOTS.find((s) => s.slot === slot)?.fallback ?? "";
