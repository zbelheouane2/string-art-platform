/** Logique pure du guide de réalisation (sans navigateur), testée à part. */

export interface GuideStep {
  /** 0 = premier fil. */
  index: number;
  from: number;
  to: number;
}

export function stepCount(sequence: readonly number[]): number {
  return Math.max(0, sequence.length - 1);
}

export function clampStep(step: number, sequence: readonly number[]): number {
  if (!Number.isFinite(step)) return 0;
  return Math.min(Math.max(0, Math.trunc(step)), stepCount(sequence));
}

export function stepAt(sequence: readonly number[], index: number): GuideStep | null {
  if (index < 0 || index >= stepCount(sequence)) return null;
  return { index, from: sequence[index], to: sequence[index + 1] };
}

/** Temps restant estimé à vitesse constante, en minutes arrondies. */
export function remainingMinutes(sequence: readonly number[], step: number, secondsPerStep: number): number {
  return Math.ceil(((stepCount(sequence) - clampStep(step, sequence)) * secondsPerStep) / 60);
}

export const SPEED = { min: 3, max: 20, default: 7 } as const;

/** Clé de sauvegarde locale de l'avancement d'un portrait. */
export function progressKey(portraitId: string): string {
  return `dk-guide:${portraitId}`;
}

export interface SavedProgress {
  step: number;
  secondsPerStep: number;
  voice: boolean;
}

export function parseProgress(raw: string | null, sequence: readonly number[]): SavedProgress {
  const fallback: SavedProgress = { step: 0, secondsPerStep: SPEED.default, voice: true };
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw) as Partial<SavedProgress>;
    const speed = Number(data.secondsPerStep);
    return {
      step: clampStep(Number(data.step), sequence),
      secondsPerStep: speed >= SPEED.min && speed <= SPEED.max ? speed : SPEED.default,
      voice: data.voice !== false,
    };
  } catch {
    return fallback;
  }
}
