import { describe, expect, it } from "vitest";
import { WILAYAS } from "@/config/wilayas";
import { normalizeDzPhone, orderSchema } from "@/lib/orderSchema";

const base = { fullName: "Client Test", phone: "0555123456", wilaya: "16", commune: "Bab Ezzouar", delivery: "yalidine_desk", payment: "cod", quantity: "1" };

describe("commande", () => {
  it("normalise les numéros mobiles algériens", () => {
    expect(normalizeDzPhone("+213 555 12 34 56")).toBe("0555123456");
    expect(normalizeDzPhone("00213 6 61 22 33 44")).toBe("0661223344");
    expect(normalizeDzPhone("07.70.12.34.56")).toBe("0770123456");
    expect(normalizeDzPhone("021 12 34 56")).toBeNull();
    expect(normalizeDzPhone("0855123456")).toBeNull();
  });

  it("valide une commande au bureau sans adresse", () => {
    const r = orderSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data?.quantity).toBe(1);
    expect(r.data?.locale).toBe("fr");
  });

  it("exige l'adresse pour la livraison à domicile", () => {
    const r = orderSchema.safeParse({ ...base, delivery: "yalidine_home" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ path: ["address"], message: "address" });
    expect(orderSchema.safeParse({ ...base, delivery: "yalidine_home", address: "12 rue des Martyrs" }).success).toBe(true);
  });

  it("refuse wilaya inconnue, quantité excessive et téléphone fixe", () => {
    const r = orderSchema.safeParse({ ...base, wilaya: "70", quantity: "50", phone: "021123456" });
    const messages = r.error?.issues.map((i) => i.message).sort();
    expect(messages).toEqual(["phone", "quantity", "wilaya"]);
  });

  it("propose les 69 wilayas, numérotées de 01 à 69", () => {
    expect(WILAYAS).toHaveLength(69);
    expect(WILAYAS.map((w) => Number(w.code))).toEqual(Array.from({ length: 69 }, (_, i) => i + 1));
    expect(WILAYAS.every((w) => w.fr && w.ar)).toBe(true);
  });
});
