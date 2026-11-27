import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRole } from "./permissions";

/**
 * Jeton de session de l'espace admin, signé (HMAC) : qui est connecté, avec
 * quel rôle, jusqu'à quand. « owner » désigne le propriétaire (ADMIN_PASSWORD).
 * `v` suit AdminUser.sessionVersion : un compte désactivé ou dont le mot de
 * passe a changé perd ses sessions ouvertes.
 */
export interface SessionPayload {
  uid: string;
  role: AdminRole;
  v: number;
  exp: number;
}

export const SESSION_HOURS = 12;

const sign = (payload: string, secret: string) => createHmac("sha256", `admin:${secret}`).update(payload).digest("base64url");

export function encodeSession(p: Omit<SessionPayload, "exp">, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...p, exp: now + SESSION_HOURS * 3_600_000 })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeSession(token: string | undefined, secret: string, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(token.slice(i + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionPayload;
    if (typeof p.uid !== "string" || (p.role !== "ADMIN" && p.role !== "EMPLOYEE") || !Number.isFinite(p.exp) || p.exp <= now) return null;
    return p;
  } catch {
    return null;
  }
}
