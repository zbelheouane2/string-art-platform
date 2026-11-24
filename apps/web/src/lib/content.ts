import "server-only";
import { db } from "@/lib/db";
import { applyOverrides, type Messages } from "./contentTools";

/** Textes d'une langue : fichier d'origine + modifications de l'admin (repli sur le fichier si la base ne répond pas). */
export async function loadMessages(locale: string): Promise<Messages> {
  const base = (await import(`../../messages/${locale}.json`)).default as Messages;
  try {
    const overrides = await db().contentOverride.findMany({ where: { locale }, select: { key: true, value: true } });
    return applyOverrides(base, overrides);
  } catch {
    return base;
  }
}

export async function originalMessages(locale: string): Promise<Messages> {
  return (await import(`../../messages/${locale}.json`)).default as Messages;
}
