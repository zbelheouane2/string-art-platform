import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Espace admin : un seul compte, protégé par le mot de passe ADMIN_PASSWORD
 * (variable d'environnement, jamais dans le code). Sans cette variable,
 * l'espace admin est fermé. Après connexion, un cookie signé (HttpOnly,
 * SameSite=Strict) garde la session 12 heures.
 */
export const ADMIN_COOKIE = "dk_admin";
const SESSION_HOURS = 12;

export function adminEnabled(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 10;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  return "dev-only-session-secret-change-me-0000";
}

const sign = (payload: string) => createHmac("sha256", `admin:${secret()}`).update(payload).digest("base64url");
const digest = (s: string) => createHash("sha256").update(s).digest();

/** Comparaison en temps constant (empreintes de même longueur). */
export function passwordMatches(input: string): boolean {
  if (!adminEnabled()) return false;
  return timingSafeEqual(digest(input), digest(process.env.ADMIN_PASSWORD!));
}

export function encodeAdminSession(now = Date.now()): string {
  const payload = `admin.${now + SESSION_HOURS * 3_600_000}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeAdminSession(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminEnabled()) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(token.slice(i + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  const exp = Number(payload.split(".")[1]);
  return Number.isFinite(exp) && exp > now;
}

export async function isAdmin(): Promise<boolean> {
  return decodeAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** À appeler en tête de chaque page et de chaque action de l'admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/connexion");
}

/** Anti force brute : 5 essais ratés par quart d'heure et par appareil (mémoire du serveur). */
const failures = new Map<string, { count: number; until: number }>();
export function loginBlocked(fingerprint: string, now = Date.now()): boolean {
  const f = failures.get(fingerprint);
  return !!f && f.until > now && f.count >= 5;
}
export function recordLoginFailure(fingerprint: string, now = Date.now()): void {
  const f = failures.get(fingerprint);
  if (!f || f.until <= now) failures.set(fingerprint, { count: 1, until: now + 15 * 60_000 });
  else f.count++;
}
export function clearLoginFailures(fingerprint: string): void {
  failures.delete(fingerprint);
}
