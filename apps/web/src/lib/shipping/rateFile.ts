/**
 * Lecture du fichier de tarifs de livraison (CSV, séparateur « , » ou « ; »,
 * comme l'exporte Excel ou Google Sheets) :
 *
 *   wilaya;domicile;bureau
 *   16;400;250
 *   01 - Adrar;1400;900
 *
 * Montants en dinars, cellule vide = tarif inconnu (confirmé par téléphone).
 * La colonne wilaya accepte « 16 », « 16 - Alger » ou « Alger ».
 */
import { WILAYAS } from "@/config/wilayas";

export interface RateRow {
  zone: string;
  home: number | null;
  desk: number | null;
}

export type RateFileResult = { ok: true; rows: RateRow[] } | { ok: false; errors: string[] };

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "");
}

export function wilayaCode(cell: string): string | null {
  const m = /^\s*(\d{1,2})\b/.exec(cell);
  if (m) {
    const code = m[1].padStart(2, "0");
    return WILAYAS.some((w) => w.code === code) ? code : null;
  }
  const n = normalize(cell);
  return WILAYAS.find((w) => normalize(w.fr) === n || normalize(w.ar) === n)?.code ?? null;
}

function amount(cell: string | undefined): number | null | "invalid" {
  const v = (cell ?? "").replace(/\s|da|dzd/gi, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100_000 ? Math.round(n) : "invalid";
}

export function parseRateFile(text: string): RateFileResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const errors: string[] = [];
  const rows = new Map<string, RateRow>();
  const sep = (lines[0] ?? "").includes(";") ? ";" : ",";
  lines.slice(1).forEach((line, i) => {
    const [w, home, desk] = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const zone = wilayaCode(w ?? "");
    const h = amount(home);
    const d = amount(desk);
    if (!zone) errors.push(`ligne ${i + 2} : wilaya inconnue « ${w} »`);
    else if (h === "invalid" || d === "invalid") errors.push(`ligne ${i + 2} : montant invalide`);
    else if (rows.has(zone)) errors.push(`ligne ${i + 2} : wilaya ${zone} en double`);
    else rows.set(zone, { zone, home: h, desk: d });
  });
  return errors.length ? { ok: false, errors } : { ok: true, rows: [...rows.values()] };
}
