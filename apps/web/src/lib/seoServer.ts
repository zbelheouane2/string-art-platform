import "server-only";
import type { Metadata } from "next";
import type { IndexedPath } from "@/config/site";
import { pageMetadata } from "./seo";
import { getSetting } from "./settings";

/**
 * Métadonnées d'une page publique, avec le titre et la description choisis
 * dans l'admin (Référencement) quand ils existent, sinon ceux des textes du site.
 */
export async function seoMetadata(args: { locale: string; path: IndexedPath; title: string; description?: string }): Promise<Metadata> {
  const o = (await getSetting("seo"))[args.path || "/"]?.[args.locale];
  return pageMetadata({ ...args, title: o?.title.trim() || args.title, description: o?.description.trim() || args.description });
}
