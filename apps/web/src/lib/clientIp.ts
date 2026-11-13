import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Empreinte de l'adresse IP du visiteur, pour limiter les essais de codes.
 * L'adresse elle-même n'est jamais enregistrée (seulement son empreinte salée).
 */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.SESSION_SECRET ?? "dev";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
