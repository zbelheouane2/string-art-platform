import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/** Journal des opérations de l'admin (jamais de données personnelles en clair). */
export const audit = (actor: string, action: string, target: string, meta: object = {}) => db().auditLog.create({ data: { actor, action, target, meta } });

/** Retour sur une page avec un message (?ok=… ou ?erreur=…). */
export const go = (path: string, msg: { ok?: string; erreur?: string }): never => redirect(`${path}${path.includes("?") ? "&" : "?"}${new URLSearchParams(msg as Record<string, string>)}`);

/** Le site public relit textes, prix et réglages à chaque page : on vide les caches. */
export const refreshSite = () => revalidatePath("/", "layout");

export const str = (form: FormData, key: string, max = 500) => String(form.get(key) ?? "").trim().slice(0, max);
export const texts3 = (form: FormData, prefix: string, max = 300) => ({ fr: str(form, `${prefix}_fr`, max), en: str(form, `${prefix}_en`, max), ar: str(form, `${prefix}_ar`, max) });
