import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { can, type AdminRole, type Permission } from "./permissions";
import { decodeSession, encodeSession } from "./session";

/**
 * Espace admin. Deux façons d'entrer :
 * - le propriétaire, avec ADMIN_PASSWORD (variable d'environnement, jamais dans
 *   le code) : accès total, identifiant « admin » ou laissé vide ;
 * - les comptes nominatifs créés dans l'admin (table AdminUser), avec un rôle
 *   Administrateur ou Employé.
 * Après connexion, un cookie signé (HttpOnly, SameSite=Strict) garde la session 12 heures.
 */
export const ADMIN_COOKIE = "dk_admin";
export const OWNER_UID = "owner";

export interface AdminIdentity {
  uid: string;
  name: string;
  role: AdminRole;
  /** Valeur du champ « actor » du journal. */
  actor: string;
}

/** Le propriétaire peut-il se connecter (mot de passe configuré sur le serveur) ? */
export function adminEnabled(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 10;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  return "dev-only-session-secret-change-me-0000";
}

const digest = (s: string) => createHash("sha256").update(s).digest();

/** Mot de passe du propriétaire (comparaison en temps constant). */
export function ownerPasswordMatches(input: string): boolean {
  if (!adminEnabled()) return false;
  return timingSafeEqual(digest(input), digest(process.env.ADMIN_PASSWORD!));
}

/**
 * Version des sessions du propriétaire, tirée de son mot de passe : changer
 * ADMIN_PASSWORD sur le serveur déconnecte toutes ses sessions ouvertes.
 */
export function ownerSessionVersion(): number {
  return createHash("sha256").update(`owner-session:${secret()}:${process.env.ADMIN_PASSWORD ?? ""}`).digest().readUInt32BE(0);
}

export function newSessionToken(uid: string, role: AdminRole, v: number): string {
  return encodeSession({ uid, role, v }, secret());
}

/** Qui est connecté (relu en base pour les comptes : désactivation immédiate). */
export const currentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const p = decodeSession((await cookies()).get(ADMIN_COOKIE)?.value, secret());
  if (!p) return null;
  if (p.uid === OWNER_UID) return adminEnabled() && p.v === ownerSessionVersion() ? { uid: OWNER_UID, name: "Propriétaire", role: "ADMIN", actor: "admin" } : null;
  const u = await db().adminUser.findUnique({ where: { id: p.uid } });
  if (!u || !u.active || u.sessionVersion !== p.v) return null;
  return { uid: u.id, name: u.name, role: u.role, actor: `admin:${u.login}` };
});

export async function isAdmin(permission: Permission = "dashboard"): Promise<boolean> {
  const a = await currentAdmin();
  return !!a && can(a.role, permission);
}

/** À appeler en tête de chaque page et de chaque action de l'admin. */
export async function requireAdmin(permission: Permission = "dashboard"): Promise<AdminIdentity> {
  const a = await currentAdmin();
  if (!a) redirect("/admin/connexion");
  if (!can(a.role, permission)) redirect(`/admin?${new URLSearchParams({ erreur: "Cette rubrique est réservée à l'administrateur." })}`);
  return a;
}

/**
 * Anti force brute, compté en base (survit aux redémarrages du serveur) :
 * - 5 essais ratés par quart d'heure et par appareil ;
 * - 20 essais ratés par quart d'heure sur un même identifiant, quel que soit
 *   l'appareil (un pirate qui change d'adresse reste bloqué). Le bon mot de
 *   passe reste refusé pendant ce temps, puis tout se rouvre seul.
 */
export const LOGIN_WINDOW_MS = 15 * 60_000;
export const LOGIN_MAX_PER_DEVICE = 5;
export const LOGIN_MAX_PER_LOGIN = 20;
export const LOGIN_DEVICE_ACTION = "admin.login_device";

export async function loginBlocked(fingerprint: string, login: string, now = Date.now()): Promise<boolean> {
  const since = new Date(now - LOGIN_WINDOW_MS);
  const [device, account] = await Promise.all([
    db().auditLog.count({ where: { action: LOGIN_DEVICE_ACTION, target: fingerprint, createdAt: { gte: since } } }),
    db().auditLog.count({ where: { action: "admin.login_failed", target: login, createdAt: { gte: since } } }),
  ]);
  return device >= LOGIN_MAX_PER_DEVICE || account >= LOGIN_MAX_PER_LOGIN;
}

/** Échec : une ligne par appareil (empreinte, jamais l'adresse) et une par identifiant (visible dans le journal). */
export async function recordLoginFailure(fingerprint: string, login: string): Promise<void> {
  await db().auditLog.createMany({
    data: [
      { actor: "system", action: LOGIN_DEVICE_ACTION, target: fingerprint },
      { actor: "system", action: "admin.login_failed", target: login },
    ],
  });
}
