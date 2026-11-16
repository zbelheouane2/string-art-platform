import { describe, expect, it } from "vitest";
import { normalizePromo, promoDiscount } from "@/lib/promoRules";

describe("codes promo", () => {
  it("normalise la saisie", () => {
    expect(normalizePromo(" bienvenue 10 ")).toBe("BIENVENUE10");
    expect(normalizePromo("a")).toBeNull();
    expect(normalizePromo("é!")).toBeNull();
  });

  it("pourcentage arrondi au dinar, plafonné à 90 %", () => {
    expect(promoDiscount({ code: "X", kind: "PERCENT", value: 10, currency: null }, 490000, "DZD")).toBe(49000);
    expect(promoDiscount({ code: "X", kind: "PERCENT", value: 15, currency: null }, 490050, "DZD")).toBe(73500);
    expect(promoDiscount({ code: "X", kind: "PERCENT", value: 100, currency: null }, 100000, "DZD")).toBe(90000);
  });

  it("montant fixe : jamais plus que les articles, ignoré dans une autre devise", () => {
    expect(promoDiscount({ code: "X", kind: "FIXED", value: 50000, currency: "DZD" }, 490000, "DZD")).toBe(50000);
    expect(promoDiscount({ code: "X", kind: "FIXED", value: 900000, currency: "DZD" }, 490000, "DZD")).toBe(490000);
    expect(promoDiscount({ code: "X", kind: "FIXED", value: 500, currency: "EUR" }, 490000, "DZD")).toBe(0);
  });
});
