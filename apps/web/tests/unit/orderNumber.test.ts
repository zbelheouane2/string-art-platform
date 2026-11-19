import { describe, expect, it } from "vitest";
import { normalizeOrderNumber } from "@/lib/orderNumber";

describe("normalizeOrderNumber", () => {
  it("accepte les saisies courantes", () => {
    expect(normalizeOrderNumber("DK-AB12CD")).toBe("DK-AB12CD");
    expect(normalizeOrderNumber(" dk-ab12cd ")).toBe("DK-AB12CD");
    expect(normalizeOrderNumber("DKAB12CD")).toBe("DK-AB12CD");
    expect(normalizeOrderNumber("ab 12 cd")).toBe("DK-AB12CD");
  });

  it("refuse le reste", () => {
    expect(normalizeOrderNumber("")).toBeNull();
    expect(normalizeOrderNumber("DK-AB12")).toBeNull();
    expect(normalizeOrderNumber("DK-AB12CD9")).toBeNull();
    expect(normalizeOrderNumber("DK-AB$2CD")).toBeNull();
  });
});
