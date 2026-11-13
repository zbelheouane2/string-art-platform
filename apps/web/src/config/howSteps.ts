import type { Step } from "@/components/StepsCarousel";

/**
 * Les 6 étapes « Comment ça marche », partagées par l'accueil et la page du kit.
 * `{locale}` dans une image : maquette d'écran déclinée par langue
 * (générée par scripts/make-step-mockups.cjs). Étape « code » en français :
 * photo réelle (son écran est en français), maquette pour les autres langues.
 */
export const HOW_STEPS = [
  { key: "open", icon: "box", img: "/visuels/etapes/ouvrir.webp" },
  { key: "prepare", icon: "spool", img: "/visuels/etapes/preparer.webp" },
  { key: "code", icon: "code", img: "/visuels/etapes/code-{locale}.webp" },
  { key: "photo", icon: "photo", img: "/visuels/etapes/photo-{locale}.webp" },
  { key: "thread", icon: "voice", img: "/visuels/etapes/voice-photo-{locale}.webp" },
  { key: "hang", icon: "frame", img: "/visuels/etapes/accrocher.webp" },
] as const;

export function howSteps(t: (key: string) => string, locale: string): Step[] {
  return HOW_STEPS.map((s) => ({
    ...s,
    img: (s.key === "code" && locale === "fr" ? "/visuels/etapes/code-photo-fr.webp" : s.img).replace("{locale}", locale),
    title: t(`kit.how.steps.${s.key}.title`),
    text: t(`kit.how.steps.${s.key}.text`),
  }));
}
