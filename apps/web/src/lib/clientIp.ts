import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { DEFAULT_TRUSTED_HEADER, pickClientIp } from "./clientIpPick";

/**
 * Empreinte de l'adresse IP du visiteur, pour limiter les essais (connexion
 * admin, codes, commandes, suivi). L'adresse elle-même n'est jamais
 * enregistrée (seulement son empreinte salée). Voir clientIpPick.ts pour le
 * choix d'une adresse que le visiteur ne peut pas falsifier.
 */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = pickClientIp((name) => h.get(name), process.env.CLIENT_IP_HEADER || DEFAULT_TRUSTED_HEADER);
  const salt = process.env.SESSION_SECRET ?? "dev";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
