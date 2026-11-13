/** Repères de clous, identiques au moteur : secteur A–D + numéro 1–60, sens horaire depuis A1. */
export const SECTORS = ["A", "B", "C", "D"] as const;
export const NAILS_PER_SECTOR = 60;
export const NAIL_COUNT = SECTORS.length * NAILS_PER_SECTOR;

export function nailLabel(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= NAIL_COUNT) {
    throw new RangeError(`clou hors plage : ${index}`);
  }
  return `${SECTORS[Math.floor(index / NAILS_PER_SECTOR)]}${(index % NAILS_PER_SECTOR) + 1}`;
}

export function nailIndex(label: string): number {
  const m = /^([A-D])([1-9]\d?)$/.exec(label);
  const n = m ? Number(m[2]) : 0;
  if (!m || n > NAILS_PER_SECTOR) throw new RangeError(`repère invalide : ${label}`);
  return SECTORS.indexOf(m[1] as (typeof SECTORS)[number]) * NAILS_PER_SECTOR + n - 1;
}

export interface DemoPortrait {
  source: string;
  engine_version: string;
  lines: number;
  thread_length_m: number;
  /** Positions normalisées dans [-1, 1], y vers le bas. */
  nails: [number, number][];
  sequence: number[];
}
