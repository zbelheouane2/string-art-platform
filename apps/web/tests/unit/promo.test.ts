import { describe, expect, it } from "vitest";
import { normalizePromo, promoDiscount, promoMinimumMet, type PromoRule } from "@/lib/promoRules";

const rule = (r: Partial<PromoRule>): PromoRule => ({ code: "X", kind: "PERCENT", scope: "ORDER", value: 10, currency: null, minOrderMinor: null, ...r });
const basket = { kitMinor: 490000, itemsMinor: 610000, feeMinor: 60000 };

describe("codes promo", () => {
  it("normalise la saisie", () => {
    expect(normalizePromo(" bienvenue 10 ")).toBe("BIENVENUE10");
    expect(normalizePromo("a")).toBeNull();
    expect(normalizePromo("é!")).toBeNull();
  });

  it("pourcentage sur tous les articles, arrondi au dinar, plafonné à 90 %", () => {
    expect(promoDiscount(rule({}), basket, "DZD")).toBe(61000);
    expect(promoDiscount(rule({ value: 15 }), { ...basket, itemsMinor: 490050 }, "DZD")).toBe(73500);
    expect(promoDiscount(rule({ value: 100 }), basket, "DZD")).toBe(549000);
  });

  it("portée : kit seul, ou livraison (offerte à 100 %, rien si les frais sont inconnus)", () => {
    expect(promoDiscount(rule({ scope: "KIT" }), basket, "DZD")).toBe(49000);
    expect(promoDiscount(rule({ scope: "SHIPPING", value: 100 }), basket, "DZD")).toBe(60000);
    expect(promoDiscount(rule({ scope: "SHIPPING", value: 100 }), { ...basket, feeMinor: null }, "DZD")).toBe(0);
    expect(promoDiscount(rule({ scope: "SHIPPING", kind: "FIXED", value: 20000, currency: "DZD" }), basket, "DZD")).toBe(20000);
  });

  it("montant fixe : jamais plus que la base, ignoré dans une autre devise", () => {
    expect(promoDiscount(rule({ kind: "FIXED", value: 50000, currency: "DZD" }), basket, "DZD")).toBe(50000);
    expect(promoDiscount(rule({ kind: "FIXED", value: 900000, currency: "DZD" }), basket, "DZD")).toBe(610000);
    expect(promoDiscount(rule({ kind: "FIXED", value: 500, currency: "EUR" }), basket, "DZD")).toBe(0);
  });

  it("minimum de commande", () => {
    const r = rule({ minOrderMinor: 700000 });
    expect(promoMinimumMet(r, basket)).toBe(false);
    expect(promoDiscount(r, basket, "DZD")).toBe(0);
    expect(promoMinimumMet(r, { ...basket, itemsMinor: 700000 })).toBe(true);
  });
});
