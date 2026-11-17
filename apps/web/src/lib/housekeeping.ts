import "server-only";
import { db } from "./db";
import { purgePortraits } from "./retention";

const EVERY_MS = 6 * 3_600_000;
let last = 0;

/**
 * Ménage périodique sans tâche planifiée (l'offre gratuite de Render n'en a pas) :
 * déclenché par la visite régulière de /api/health, au plus une fois toutes les
 * 6 heures, sans retarder la réponse.
 */
export function maybeHousekeep(now = Date.now()) {
  if (now - last < EVERY_MS) return;
  last = now;
  purgePortraits(db()).catch((e) => console.error("[ménage] effacement des portraits impossible", e instanceof Error ? e.message : e));
}
