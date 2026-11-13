import { nailLabel } from "./board";

/**
 * Phrases lues à voix haute par le guide. Le repère est écrit sur la planche
 * en lettres latines (A–D) ; on le prononce comme on le lit en Algérie :
 * lettre à la française, puis le nombre dans la langue choisie.
 */
const LETTERS: Record<string, Record<string, string>> = {
  fr: { A: "A", B: "B", C: "C", D: "D" },
  en: { A: "A", B: "B", C: "C", D: "D" },
  ar: { A: "أ", B: "بي", C: "سي", D: "دي" },
};

const START: Record<string, string> = { fr: "Départ", en: "Start", ar: "البداية" };
const THEN: Record<string, string> = { fr: "Puis", en: "Then", ar: "ثم" };
const DONE: Record<string, string> = {
  fr: "Bravo, votre portrait est terminé.",
  en: "Well done, your portrait is finished.",
  ar: "أحسنت، اكتملت لوحتك.",
};

/** BCP 47 utilisé pour choisir la voix de synthèse. */
export const SPEECH_LANG: Record<string, string> = { fr: "fr-FR", en: "en-GB", ar: "ar-SA" };

/** « C 40 » → texte prononçable, avec une pause entre la lettre et le nombre. */
export function spokenNail(index: number, locale: string): string {
  const label = nailLabel(index);
  const letters = LETTERS[locale] ?? LETTERS.fr;
  return `${letters[label[0]]}, ${label.slice(1)}`;
}

/**
 * Ce que la voix dit pour l'étape `step` (0 = premier fil) d'une séquence.
 * La première étape annonce aussi le clou de départ.
 */
export function stepPhrase(sequence: readonly number[], step: number, locale: string): string {
  const lang = LETTERS[locale] ? locale : "fr";
  if (step >= sequence.length - 1) return DONE[lang];
  const to = spokenNail(sequence[step + 1], lang);
  if (step === 0) return `${START[lang]} ${spokenNail(sequence[0], lang)}. ${THEN[lang]} ${to}.`;
  return `${to}.`;
}
