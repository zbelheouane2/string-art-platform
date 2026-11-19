import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { commerce } from "../config/commerce";

const DAY_MS = 86_400_000;

/**
 * Libère la base des instructions de portraits devenues inutiles :
 * - les essais non retenus d'un code déjà utilisé (un autre portrait a été validé) ;
 * - les portraits terminés (dernier fil atteint) depuis plus de
 *   `commerce.finishedPortraitRetentionDays` jours.
 * Seule la séquence (le plus lourd) est effacée : la trace du portrait, le code
 * et les commandes restent. Sans effet sur un portrait encore en cours.
 */
export async function purgePortraits(client: PrismaClient, now = new Date()) {
  const cutoff = new Date(now.getTime() - commerce.finishedPortraitRetentionDays * DAY_MS);
  const cleared = { document: Prisma.DbNull, purgedAt: now };
  const trials = await client.generation.updateMany({
    where: { chosen: false, purgedAt: null, activationCode: { status: "USED" } },
    data: cleared,
  });
  const finished = await client.generation.updateMany({
    where: { chosen: true, purgedAt: null, guideDoneAt: { lte: cutoff } },
    data: cleared,
  });
  if (trials.count + finished.count > 0) {
    await client.auditLog.create({
      data: { actor: "system", action: "portraits.purged", meta: { trials: trials.count, finished: finished.count } },
    });
  }
  return { trials: trials.count, finished: finished.count };
}
