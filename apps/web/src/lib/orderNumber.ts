/** Numéro saisi → forme canonique DK-XXXXXX (espaces, minuscules, tiret oublié). */
export function normalizeOrderNumber(input: string): string | null {
  const s = input.toUpperCase().replace(/[\s_.]/g, "").replace(/^DK-?/, "");
  return /^[0-9A-Z]{6}$/.test(s) ? `DK-${s}` : null;
}
