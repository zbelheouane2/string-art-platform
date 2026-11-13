import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/price";

describe("formatPrice", () => {
  const p = { amountMinor: 490000, currency: "DZD" };
  it("affiche le dinar avec le libellé local, sans centimes", () => {
    expect(formatPrice(p, "fr").replace(/\s/g, " ")).toBe("4 900 DA");
    expect(formatPrice(p, "en")).toBe("DZD 4,900");
    expect(formatPrice(p, "ar").replace(/\s/g, " ")).toBe("4 900 د.ج");
  });
  it("garde les centimes quand le montant n'est pas rond", () => {
    expect(formatPrice({ amountMinor: 1999, currency: "EUR" }, "fr").replace(/\s/g, " ")).toBe("19,99 €");
  });
  it("retombe sur Intl pour une devise sans libellé", () => {
    expect(formatPrice({ amountMinor: 5000, currency: "USD" }, "en")).toBe("$50");
  });
});
