import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, checkChar, generateCode, parseCode } from "@/lib/codes";

describe("codes d'activation", () => {
  it("génère des codes XXXX-XXXX valides, sans caractère ambigu", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCode();
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRTVWXYZ]{4}$/);
      expect(parseCode(code)).toEqual({ ok: true, code });
    }
    expect(CODE_ALPHABET).toHaveLength(29);
  });

  it("accepte minuscules, espaces, sans tiret et S/U tapés à la place de 5/V", () => {
    const body = "5V7KQ2P";
    const code = `${body.slice(0, 4)}-${body.slice(4)}${checkChar(body)}`;
    expect(parseCode(code.toLowerCase().replace("-", " "))).toEqual({ ok: true, code });
    expect(parseCode(code.replace("5", "S").replace("V", "U"))).toEqual({ ok: true, code });
  });

  it("détecte toute faute sur un caractère et toute inversion de voisins", () => {
    const code = generateCode().replace("-", "");
    for (let i = 0; i < 8; i++) {
      for (const c of CODE_ALPHABET) {
        if (c === code[i]) continue;
        expect(parseCode(code.slice(0, i) + c + code.slice(i + 1)).ok).toBe(false);
      }
      if (i < 7 && code[i] !== code[i + 1]) {
        expect(parseCode(code.slice(0, i) + code[i + 1] + code[i] + code.slice(i + 2)).ok).toBe(false);
      }
    }
  });

  it("refuse les longueurs et caractères invalides", () => {
    expect(parseCode("ABC")).toEqual({ ok: false, reason: "length" });
    expect(parseCode("ABCD-EF0I")).toEqual({ ok: false, reason: "characters" });
  });
});
