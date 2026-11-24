import "server-only";
import { db } from "@/lib/db";

export interface ShowcaseItem {
  id: string;
  photo: string;
  thread: string;
  label: string;
}

/** Exemples d'origine, si la base ne répond pas. */
const FALLBACK = [
  { id: "ex_portrait", photo: "/visuels/boucles-photo.webp", thread: "/visuels/boucles-fil.webp", labels: { fr: "Portrait", en: "Portrait", ar: "صورة شخصية" } },
  { id: "ex_pet", photo: "/visuels/chat-photo.webp", thread: "/visuels/chat-fil.webp", labels: { fr: "Animal", en: "Pet", ar: "حيوان أليف" } },
  { id: "ex_group", photo: "/visuels/jeune-photo.webp", thread: "/visuels/jeune-fil.webp", labels: { fr: "Souvenir", en: "Memory", ar: "ذكرى" } },
];

/** Exemples avant/après de la fiche du kit, dans l'ordre choisi dans l'admin. */
export async function showcaseExamples(locale: string): Promise<ShowcaseItem[]> {
  const pick = (labels: Record<string, string>) => labels[locale] || labels.fr || "";
  try {
    const rows = await db().showcaseExample.findMany({ where: { active: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
    return rows.map((r) => ({ id: r.id, photo: r.photoUrl, thread: r.threadUrl, label: pick(r.labels as Record<string, string>) }));
  } catch {
    return FALLBACK.map((f) => ({ id: f.id, photo: f.photo, thread: f.thread, label: pick(f.labels) }));
  }
}
