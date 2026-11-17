import "server-only";
import { createHash } from "node:crypto";
import { commerce } from "@/config/commerce";
import { db } from "./db";
import { clampStep, stepCount } from "./guide";
import { EngineError, frame, generate } from "./engine";

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

/** Refus communs à l'envoi d'une photo (code utilisable, type et taille du fichier). */
async function checkUpload(codeId: string, photo: File): Promise<PortraitError | null> {
  const state = await codeState(codeId);
  if (!state) return "noSession";
  if (state.status === "DISABLED") return "disabled";
  if (state.chosenId) return "used";
  if (!(commerce.acceptedPhotoTypes as readonly string[]).includes(photo.type)) return "fileType";
  if (photo.size > commerce.maxPhotoBytes) return "fileSize";
  return null;
}

export interface PhotoFrame {
  crop: [number, number, number];
  faceDetected: boolean;
  width: number;
  height: number;
}

/**
 * Cadrage proposé pour une photo (visage centré). Ne compte pas comme un essai
 * et ne garde rien : la photo est transmise au moteur puis oubliée.
 */
export async function proposeFrame(codeId: string, photo: File): Promise<{ ok: true; frame: PhotoFrame } | { ok: false; error: PortraitError }> {
  const refused = await checkUpload(codeId, photo);
  if (refused) return { ok: false, error: refused };
  try {
    const f = await frame(new Blob([Buffer.from(await photo.arrayBuffer())], { type: photo.type }));
    return { ok: true, frame: { crop: f.crop_box, faceDetected: f.face_detected, width: f.width, height: f.height } };
  } catch (err) {
    if (err instanceof EngineError && err.status === 422) return { ok: false, error: "photo" };
    console.error("cadrage : moteur indisponible", err instanceof Error ? err.message : err);
    return { ok: false, error: "engine" };
  }
}

/**
 * Calcule un portrait pour le code ouvert. La photo est transmise au moteur
 * puis oubliée : seule son empreinte SHA-256 est conservée avec la séquence.
 */
export async function createPortrait(
  codeId: string,
  photo: File,
  options: { variant: Variant; background: "light" | "keep"; crop?: [number, number, number] | null },
): Promise<{ ok: true; portrait: PortraitPreview } | { ok: false; error: PortraitError }> {
  const refused = await checkUpload(codeId, photo);
  if (refused) return { ok: false, error: refused };
  const state = await codeState(codeId);
  if (!state || state.remaining <= 0) return { ok: false, error: state ? "limit" : "noSession" };

  const bytes = Buffer.from(await photo.arrayBuffer());
  const sha = createHash("sha256").update(bytes).digest("hex");
  let result;
  try {
    result = await generate({
      photo: new Blob([bytes], { type: photo.type }),
      variant: options.variant,
      background: options.background,
      crop: options.crop ?? undefined,
      previewSize: 800,
    });
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

/** Portrait validé de ce code dont les instructions ont été effacées (terminé depuis le délai prévu). */
export async function purgedPortrait(codeId: string, generationId: string) {
  return db().generation.findFirst({
    where: { id: generationId, activationCodeId: codeId, chosen: true, purgedAt: { not: null } },
    select: { guideDoneAt: true, purgedAt: true },
  });
}

/** Séquence d'un portrait, seulement pour l'appareil qui a ouvert le code correspondant. */
export async function portraitSequence(codeId: string, generationId: string) {
  const gen = await db().generation.findFirst({
    where: { id: generationId, activationCodeId: codeId, status: "DONE" },
    select: { id: true, document: true, guideStep: true, guideStepAt: true, guideDoneAt: true },
  });
  if (!gen?.document) return null;
  const doc = gen.document as { sequence: number[]; summary: { lines: number; thread_length_m: number } };
  return {
    id: gen.id,
    sequence: doc.sequence,
    lines: doc.summary.lines,
    threadLengthM: doc.summary.thread_length_m,
    saved: gen.guideStepAt ? { step: gen.guideStep, at: gen.guideStepAt.getTime() } : null,
    doneAt: gen.guideDoneAt,
  };
}

/**
 * Enregistre l'avancement du guide pour le portrait de ce code (reprise sur un
 * autre appareil). Le numéro est borné à la longueur de la séquence.
 */
export async function saveGuideStep(codeId: string, generationId: string, step: number): Promise<boolean> {
  const portrait = await portraitSequence(codeId, generationId);
  if (!portrait) return false;
  const safe = clampStep(step, portrait.sequence);
  const now = new Date();
  const finished = safe === stepCount(portrait.sequence);
  await db().generation.update({
    where: { id: portrait.id },
    // Terminé : le délai avant effacement part du premier passage au dernier fil.
    data: { guideStep: safe, guideStepAt: now, guideDoneAt: finished ? (portrait.doneAt ?? now) : null },
  });
  return true;
}
