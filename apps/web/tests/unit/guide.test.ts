import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { nailPositions, type DemoPortrait } from "@/lib/board";
import { SPEED, clampStep, parseProgress, remainingMinutes, stepAt, stepCount } from "@/lib/guide";
import { spokenNail, stepPhrase } from "@/lib/voice";

const seq = [0, 99, 159, 5];

describe("guide", () => {
  it("compte les fils et borne l'étape", () => {
    expect(stepCount(seq)).toBe(3);
    expect(clampStep(-4, seq)).toBe(0);
    expect(clampStep(99, seq)).toBe(3);
    expect(clampStep(Number.NaN, seq)).toBe(0);
    expect(stepAt(seq, 1)).toEqual({ index: 1, from: 99, to: 159 });
    expect(stepAt(seq, 3)).toBeNull();
  });

  it("estime le temps restant", () => {
    expect(remainingMinutes(seq, 0, 20)).toBe(1);
    expect(remainingMinutes(seq, 3, 20)).toBe(0);
  });

  it("relit une sauvegarde abîmée sans planter", () => {
    expect(parseProgress(null, seq)).toEqual({ step: 0, secondsPerStep: SPEED.default, voice: true });
    expect(parseProgress("{pas du json", seq).step).toBe(0);
    expect(parseProgress(JSON.stringify({ step: 50, secondsPerStep: 999, voice: false }), seq)).toEqual({ step: 3, secondsPerStep: SPEED.default, voice: false });
  });
});

describe("voix", () => {
  it("prononce le repère : lettre puis numéro", () => {
    expect(spokenNail(0, "fr")).toBe("A, 1");
    expect(spokenNail(159, "en")).toBe("C, 40");
    expect(spokenNail(239, "ar")).toBe("دي, 60");
  });

  it("annonce le départ au premier fil, puis seulement le clou suivant", () => {
    expect(stepPhrase(seq, 0, "fr")).toBe("Départ A, 1. Puis B, 40.");
    expect(stepPhrase(seq, 1, "fr")).toBe("C, 40.");
    expect(stepPhrase(seq, 3, "en")).toContain("finished");
  });
});

describe("planche", () => {
  it("positions identiques à celles exportées par le moteur", () => {
    const demo: DemoPortrait = JSON.parse(readFileSync(path.join(__dirname, "../../public/demo/portrait-demo.json"), "utf-8"));
    const mine = nailPositions();
    expect(mine).toHaveLength(240);
    demo.nails.forEach(([x, y], i) => {
      expect(mine[i][0]).toBeCloseTo(x, 4);
      expect(mine[i][1]).toBeCloseTo(y, 4);
    });
    // A1 à 9 h (gauche, milieu), B1 juste après midi.
    expect(mine[0][0]).toBeLessThan(-0.99);
    expect(mine[60][1]).toBeLessThan(-0.99);
  });
});
