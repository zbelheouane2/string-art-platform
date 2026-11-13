import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { commerce } from "@/config/commerce";

/**
 * Session « code » : après saisie d'un code valide, un cookie signé (HttpOnly)
 * mémorise quel code est ouvert sur cet appareil. Aucun compte n'est demandé
 * (parcours invité, cahier des charges §3.2).
 */
export const CODE_COOKIE = "dk_code";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  return "dev-only-session-secret-change-me-0000";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Jeton `<id du code>.<expiration>.<signature>`. */
export function encodeSession(codeId: string, now = Date.now()): string {
  const payload = `${codeId}.${now + commerce.codeSessionDays * 86_400_000}`;
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [codeId, expires, signature] = parts;
  const expected = Buffer.from(sign(`${codeId}.${expires}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (!(Number(expires) > now)) return null;
  return codeId;
}

export async function openCodeSession(codeId: string): Promise<void> {
  (await cookies()).set(CODE_COOKIE, encodeSession(codeId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: commerce.codeSessionDays * 86_400,
  });
}

export async function currentCodeId(): Promise<string | null> {
  return decodeSession((await cookies()).get(CODE_COOKIE)?.value);
}
