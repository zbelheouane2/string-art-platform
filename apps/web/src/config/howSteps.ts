import type { Step } from "@/components/StepsCarousel";

/** Les 5 étapes « Comment ça marche », partagées par l'accueil et la page du kit. */
export const HOW_STEPS = [
  { key: "open", icon: "box", img: "/visuels/etapes/ouvrir.webp" },
  { key: "code", icon: "code", img: "/visuels/astronaute-photo.webp" },
  { key: "photo", icon: "photo", img: "/visuels/chat-photo.webp" },
  { key: "thread", icon: "voice", img: "/visuels/etapes/preparer.webp" },
  { key: "hang", icon: "frame", img: "/visuels/etapes/accrocher.webp" },
] as const;

export function howSteps(t: (key: string) => string): Step[] {
  return HOW_STEPS.map((s) => ({
    ...s,
    title: t(`kit.how.steps.${s.key}.title`),
    text: t(`kit.how.steps.${s.key}.text`),
  }));
}
