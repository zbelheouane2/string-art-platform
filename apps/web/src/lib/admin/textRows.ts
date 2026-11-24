import "server-only";
import { originalMessages } from "@/lib/content";
import { LOCALES, flattenMessages } from "@/lib/contentTools";
import { db } from "@/lib/db";

/** Textes d'une rubrique dans les 3 langues : original et valeur actuelle (modifiée ou non). */
export async function textRows(ns: string, filter: (key: string) => boolean = () => true) {
  const originals = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, flattenMessages(await originalMessages(l))] as const)));
  const overrides = await db().contentOverride.findMany({ where: { key: { startsWith: `${ns}.` } } });
  const keys = Object.keys(originals.fr).filter((k) => (k === ns || k.startsWith(`${ns}.`)) && filter(k));
  return keys.map((key) => {
    const original = Object.fromEntries(LOCALES.map((l) => [l, originals[l][key] ?? ""]));
    const current = Object.fromEntries(LOCALES.map((l) => [l, overrides.find((o) => o.locale === l && o.key === key)?.value ?? original[l]]));
    return { key, original, current };
  });
}
