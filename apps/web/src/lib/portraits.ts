import "server-only";
import { createHash } from "node:crypto";
import { commerce } from "@/config/commerce";
import { db } from "./db";
import { EngineError, generate } from "./engine";

export const VARIANTS = ["doux", "standard", "contraste"] as const;
export type Variant = (typeof VARIANTS)[number];

export type PortraitError = "noSession" | "used" | "disabled" | "limit" | "fileType" | "fileSize" | "photo" | "engine";

export interface PortraitPreview {
  id: string;
  previewPng: string;
  lines: number;
  threadLengthM: number;
  warnings: string[];
  faceDetected: boolean;
}

/** Où en est un code : portraits déjà calculés, portrait validé, essais restants. */
export async function codeState(codeId: string) {
  const code = await db().activationCode.findUnique({
    where: { id: codeId },
    select: { id: true, status: true, generations: { select: { id: true, chosen: true } } },
  });
  if (!code) return null;
  return {
    status: code.status,
    chosenId: code.generations.find((g) => g.chosen)?.id ?? null,
    remaining: Math.max(0, commerce.maxGenerationsPerCode - code.generations.length),
  };
}

/**
 * Calcule un portrait pour le code ouvert. La photo est transmise au moteur
 * puis oubliée : seule son empreinte SHA-256 est conservée avec la séquence.
 */
export async function createPortrait(
  codeId: string,
  photo: File,
  options: { variant: Variant; background: "light" | "keep" },
): Promise<{ ok: true; portrait: PortraitPreview } | { ok: false; error: PortraitError }> {
  const state = await codeState(codeId);
  if (!state) return { ok: false, error: "noSession" };
  if (state.status === "DISABLED") return { ok: false, error: "disabled" };
  if (state.chosenId) return { ok: false, error: "used" };
  if (state.remaining <= 0) return { ok: false, error: "limit" };
  if (!(commerce.acceptedPhotoTypes as readonly string[]).includes(photo.type)) return { ok: false, error: "fileType" };
  if (photo.size > commerce.maxPhotoBytes) return { ok: false, error: "fileSize" };

  const bytes = Buffer.from(await photo.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  let result;
  try {
    result = await generate({ photo: new Blob([bytes], { type: photo.type }), variant: options.variant, background: options.background, previewSize: 800 });
  } catch (err) {
    // 422 : photo refusée par le moteur (trop petite, illisible). Le reste est une panne.
    if (err instanceof EngineError && err.status === 422) return { ok: false, error: "photo" };
    console.error("génération : moteur indisponible", err instanceof Error ? err.message : err);
    return { ok: false, error: "engine" };
  }
  const doc = result.document as typeof result.document & {
    engine_version?: string;
    photo_quality?: { warnings?: string[]; face_detected?: boolean };
  };
  const generation = await db().generation.create({
    data: {
      activationCodeId: codeId,
      status: "DONE",
      variant: options.variant,
      engineVersion: doc.engine_version ?? null,
      photoSha256: sha,
      photoKey: null,
      photoDeleteAfter: new Date(Date.now() + commerce.photoRetentionDays * 86_400_000),
      params: options,
      document: doc as object,
    },
    select: { id: true },
  });
  return {
    ok: true,
    portrait: {
      id: generation.id,
      previewPng: result.preview_png_base64,
      lines: doc.summary.lines,
      threadLengthM: doc.summary.thread_length_m,
      warnings: doc.photo_quality?.warnings ?? [],
      faceDetected: doc.photo_quality?.face_detected ?? false,
    },
  };
}

/** Valide un portrait : le code passe à « utilisé », les autres essais restent consultables. */
export async function choosePortrait(codeId: string, generationId: string): Promise<boolean> {
  const gen = await db().generation.findFirst({ where: { id: generationId, activationCodeId: codeId, status: "DONE" }, select: { id: true } });
  if (!gen) return false;
  const state = await codeState(codeId);
  if (!state || state.status === "DISABLED") return false;
  if (state.chosenId) return state.chosenId === generationId;
  await db().$transaction([
    db().generation.update({ where: { id: gen.id }, data: { chosen: true } }),
    db().activationCode.update({ where: { id: codeId }, data: { status: "USED" } }),
    db().auditLog.create({ data: { actor: "system", action: "portrait.chosen", target: gen.id } }),
  ]);
  return true;
}

/** Séquence d'un portrait, seulement pour l'appareil qui a ouvert le code correspondant. */
export async function portraitSequence(codeId: string, generationId: string) {
  const gen = await db().generation.findFirst({
    where: { id: generationId, activationCodeId: codeId, status: "DONE" },
    select: { id: true, document: true },
  });
  if (!gen?.document) return null;
  const doc = gen.document as { sequence: number[]; summary: { lines: number; thread_length_m: number } };
  return { id: gen.id, sequence: doc.sequence, lines: doc.summary.lines, threadLengthM: doc.summary.thread_length_m };
}
