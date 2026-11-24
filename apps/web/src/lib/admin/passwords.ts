import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Mots de passe des comptes admin : scrypt salé, comparaison en temps constant. */
const KEYLEN = 32;
export const MIN_PASSWORD = 10;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEYLEN).toString("base64url");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const given = scryptSync(password, salt, KEYLEN);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Identifiant : 3 à 30 caractères, minuscules, chiffres, point, tiret. */
export const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const normalizeLogin = (v: string) => v.trim().toLowerCase();
