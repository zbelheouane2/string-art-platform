import { describe, expect, it } from "vitest";
import demo from "../../public/demo/portrait-demo.json";
import { NAIL_COUNT, nailIndex, nailLabel } from "@/lib/board";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

describe("repères de clous (identiques au moteur)", () => {
  it.each([
    [0, "A1"],
    [59, "A60"],
    [60, "B1"],
    [120, "C1"],
    [239, "D60"],
  ])("%i -> %s", (i, label) => {
    expect(nailLabel(i)).toBe(label);
    expect(nailIndex(label)).toBe(i);
  });

  it("aller-retour sur les 240 clous", () => {
    for (let i = 0; i < NAIL_COUNT; i++) expect(nailIndex(nailLabel(i))).toBe(i);
  });

  it.each(["E1", "A0", "A61", "a1", ""])("refuse %s", (bad) => {
    expect(() => nailIndex(bad)).toThrow(RangeError);
  });
});

describe("portrait de démonstration", () => {
  it("est cohérent avec la planche", () => {
    expect(demo.nails).toHaveLength(NAIL_COUNT);
    expect(demo.sequence[0]).toBe(0);
    expect(demo.sequence.length - 1).toBe(demo.lines);
    expect(demo.sequence.every((n) => n >= 0 && n < NAIL_COUNT)).toBe(true);
  });
});

describe("traductions", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

  it("les trois langues ont exactement les mêmes clés", () => {
    const ref = keys(fr).sort();
    expect(keys(en).sort()).toEqual(ref);
    expect(keys(ar).sort()).toEqual(ref);
  });
});
