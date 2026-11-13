/**
 * Codes d'activation imprimés dans le kit, au format XXXX-XXXX.
 *
 * Alphabet de 29 symboles sans caractères ambigus (pas de 0, O, 1, I, L, S ni U) ; 29 est premier, ce qui permet une clé de contrôle fiable.
 * Les 7 premiers caractères sont aléatoires (29^7 ≈ 17 milliards de
 * combinaisons par lot), le 8e est la clé : elle détecte toute faute de frappe
 * sur un caractère et toute inversion de deux caractères voisins. Une simple
 * faute de saisie est donc signalée tout de suite, sans interroger la base et
 * sans compter comme une tentative suspecte.
 */
import { randomInt } from "node:crypto";

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRTVWXYZ";
const BASE = CODE_ALPHABET.length; // 29, premier
const BODY_LENGTH = 7;
/** Inverse de 8 modulo 29 (8 × 11 = 88 = 3 × 29 + 1). */
const INV_8 = 11;

/** Lettres souvent tapées à la place d'un symbole de l'alphabet. */
const LOOKALIKES: Record<string, string> = { S: "5", U: "V" };

function weightedSum(chars: string): number {
  let sum = 0;
  for (let i = 0; i < chars.length; i++) sum += (i + 1) * CODE_ALPHABET.indexOf(chars[i]);
  return sum % BASE;
}

/** Clé de contrôle : la somme pondérée des 8 caractères vaut 0 modulo 29. */
export function checkChar(body: string): string {
  const value = (((BASE - weightedSum(body)) % BASE) * INV_8) % BASE;
  return CODE_ALPHABET[value];
}

/** Nouveau code aléatoire (générateur cryptographique). */
export function generateCode(): string {
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) body += CODE_ALPHABET[randomInt(BASE)];
  return format(body + checkChar(body));
}

function format(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export type CodeCheck = { ok: true; code: string } | { ok: false; reason: "length" | "characters" | "checksum" };

/**
 * Nettoie une saisie (espaces, tirets, minuscules, lettres ressemblantes) et
 * vérifie sa forme. Ne consulte pas la base.
 */
export function parseCode(input: string): CodeCheck {
  const cleaned = input
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s\-_.]/g, "")
    .replace(/[SU]/g, (c) => LOOKALIKES[c]);
  if (cleaned.length !== BODY_LENGTH + 1) return { ok: false, reason: "length" };
  if ([...cleaned].some((c) => !CODE_ALPHABET.includes(c))) return { ok: false, reason: "characters" };
  if (weightedSum(cleaned) !== 0) return { ok: false, reason: "checksum" };
  return { ok: true, code: format(cleaned) };
}
