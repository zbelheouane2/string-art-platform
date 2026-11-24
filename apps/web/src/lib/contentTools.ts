/**
 * Outils des textes du site (sans accès à la base : testables).
 * Les textes viennent de messages/<langue>.json ; ceux modifiés dans l'admin
 * (table ContentOverride) les remplacent clé par clé.
 */
export type Messages = { [k: string]: unknown };

/** Aplatit les textes : « faq.items.who.q » → valeur (les listes par index : « legal.delivery.sections.0.h »). */
export function flattenMessages(obj: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof obj === "string") out[prefix] = obj;
  else if (Array.isArray(obj)) obj.forEach((v, i) => flattenMessages(v, prefix ? `${prefix}.${i}` : String(i), out));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) flattenMessages(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

/** Copie des textes avec les remplacements appliqués (clés inconnues ignorées). */
export function applyOverrides<T extends Messages>(messages: T, overrides: { key: string; value: string }[]): T {
  if (overrides.length === 0) return messages;
  const copy = structuredClone(messages) as Messages;
  for (const { key, value } of overrides) {
    const parts = key.split(".");
    let node: unknown = copy;
    for (const p of parts.slice(0, -1)) {
      node = node && typeof node === "object" ? (node as Record<string, unknown>)[p] : undefined;
    }
    const last = parts[parts.length - 1];
    if (node && typeof node === "object" && typeof (node as Record<string, unknown>)[last] === "string") (node as Record<string, unknown>)[last] = value;
  }
  return copy as T;
}

/** Variables entre accolades d'un texte ({brand}, {count}…), sans les sous-messages des pluriels. */
export function placeholders(text: string): string[] {
  const names = new Set<string>();
  for (const m of text.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)) names.add(m[1]);
  return [...names].sort();
}

function bracesBalanced(text: string): boolean {
  let depth = 0;
  for (const c of text) {
    if (c === "{") depth++;
    else if (c === "}" && --depth < 0) return false;
  }
  return depth === 0;
}

/**
 * Vérifie un texte modifié : mêmes variables que l'original (sinon la page
 * planterait ou afficherait « {brand} »), accolades équilibrées, longueur raisonnable.
 * Renvoie un message d'erreur en français, ou null si tout va bien.
 */
export function checkEditedText(original: string, edited: string): string | null {
  if (edited.length > 4000) return "Texte trop long (4 000 caractères au plus).";
  if (!bracesBalanced(edited)) return "Accolades { } incomplètes.";
  const want = placeholders(original);
  const got = placeholders(edited);
  const missing = want.filter((p) => !got.includes(p));
  const extra = got.filter((p) => !want.includes(p));
  if (missing.length) return `Gardez ${missing.map((p) => `{${p}}`).join(", ")} dans le texte (remplacé automatiquement sur le site).`;
  if (extra.length) return `${extra.map((p) => `{${p}}`).join(", ")} n'existe pas ici : retirez les accolades.`;
  if (/\{\s*\w+\s*,\s*plural/.test(original) && !/\{\s*\w+\s*,\s*plural/.test(edited)) return "Gardez la forme {count, plural, …} de ce texte.";
  return null;
}

/** Rubriques de textes proposées dans l'admin, avec leur nom en français. */
export const CONTENT_SECTIONS: { ns: string; label: string }[] = [
  { ns: "announcement", label: "Bande d'annonce (texte d'origine)" },
  { ns: "hero", label: "Accueil : haut de page" },
  { ns: "trust", label: "Accueil : bandeau de confiance" },
  { ns: "home", label: "Accueil : sections" },
  { ns: "gifts", label: "Accueil : idées cadeaux" },
  { ns: "what", label: "Avant / après" },
  { ns: "howGift", label: "Offrir en cadeau" },
  { ns: "final", label: "Accueil : appel final" },
  { ns: "faq", label: "FAQ" },
  { ns: "kit", label: "Fiche du kit" },
  { ns: "shop", label: "Achat et prix" },
  { ns: "accessories", label: "Options du kit" },
  { ns: "cart", label: "Panier" },
  { ns: "order", label: "Page de commande" },
  { ns: "confirmation", label: "Confirmation de commande" },
  { ns: "track", label: "Suivi de commande" },
  { ns: "activate", label: "Activation du code" },
  { ns: "create", label: "Création du portrait" },
  { ns: "guide", label: "Guide de réalisation" },
  { ns: "digital", label: "Offre numérique" },
  { ns: "contact", label: "Page contact" },
  { ns: "legal", label: "Pages légales (livraison, retours, confidentialité, conditions)" },
  { ns: "reviews", label: "Avis clients" },
  { ns: "nav", label: "Menu" },
  { ns: "footer", label: "Pied de page" },
  { ns: "reassure", label: "Réassurance" },
  { ns: "sticky", label: "Barre d'achat en bas d'écran" },
  { ns: "carousel", label: "Carrousels" },
  { ns: "consent", label: "Bandeau cookies" },
  { ns: "meta", label: "Titre et description Google (accueil)" },
  { ns: "notFound", label: "Page introuvable" },
  { ns: "a11y", label: "Accessibilité" },
];

export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_FR: Record<Locale, string> = { fr: "Français", ar: "Arabe", en: "Anglais" };
