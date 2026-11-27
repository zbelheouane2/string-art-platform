/**
 * Adresse IP du visiteur, sans faire confiance à ce qu'il envoie lui-même.
 *
 * Le début de X-Forwarded-For est écrit par le navigateur : un pirate peut y
 * mettre n'importe quoi à chaque requête et contourner les limites d'essais.
 * Seule la fin de la liste est ajoutée par nos propres relais.
 *
 * - En-tête de confiance (CLIENT_IP_HEADER, par défaut « cf-connecting-ip ») :
 *   sur Render, Cloudflare est devant le site et écrase toujours cet en-tête
 *   avec la vraie adresse. Sur le VPS, Caddy le supprime à l'entrée
 *   (deploy/Caddyfile), donc personne ne peut l'injecter. « none » le désactive.
 * - Sinon : la dernière adresse de X-Forwarded-For, celle ajoutée par le relais
 *   le plus proche (Caddy sur le VPS).
 */
export const DEFAULT_TRUSTED_HEADER = "cf-connecting-ip";

export function pickClientIp(get: (name: string) => string | null, trustedHeader?: string): string {
  const name = trustedHeader?.trim().toLowerCase();
  if (name && name !== "none") {
    const v = get(name)?.split(",")[0]?.trim();
    if (v) return v;
  }
  const chain = (get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return chain.at(-1) || get("x-real-ip")?.trim() || "unknown";
}
