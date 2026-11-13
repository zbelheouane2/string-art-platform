import { describe, expect, it } from "vitest";
import { OTHER_COMMUNE, communeCount, communesOf } from "@/config/communes";
import { WILAYAS } from "@/config/wilayas";
import { giftFieldErrors, normalizeDzPhone, normalizeIntlPhone, orderSchema } from "@/lib/orderSchema";

const base = { fullName: "Client Test", phone: "0555123456", wilaya: "16", commune: "Bab Ezzouar", delivery: "zrexpress_desk", payment: "cod", quantity: "1" };

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

  it("livraison à domicile sans adresse complète", () => {
    // Aucune adresse demandée, même à domicile ; une adresse envoyée quand même est ignorée.
    const r = orderSchema.safeParse({ ...base, delivery: "zrexpress_home", address: "12 rue des Martyrs" });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("address");
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

  it("contient les 1 541 communes, réparties dans les 69 wilayas, avec noms français et arabes", () => {
    expect(communeCount()).toBe(1541);
    for (const w of WILAYAS) expect(communesOf(w.code).length).toBeGreaterThan(0);
    // Nouvelles wilayas (loi 26-06) : effectifs annoncés par le texte.
    const expected: Record<string, number> = { "59": 12, "60": 8, "61": 5, "62": 4, "63": 4, "64": 6, "65": 10, "66": 8, "67": 21, "68": 23, "69": 7 };
    for (const [code, n] of Object.entries(expected)) expect(communesOf(code)).toHaveLength(n);
    expect(communesOf("68").map(([fr]) => fr)).toContain("Bou Saada");
    expect(communesOf("28").map(([fr]) => fr)).not.toContain("Bou Saada");
    expect(Object.values(WILAYAS).every((w) => communesOf(w.code).every(([fr, ar]) => fr && /[\u0600-\u06ff]/.test(ar)))).toBe(true);
  });

  it("refuse une commune d'une autre wilaya, accepte la saisie libre", () => {
    expect(orderSchema.safeParse({ ...base, commune: "Boufarik" }).success).toBe(false);
    const other = orderSchema.safeParse({ ...base, commune: OTHER_COMMUNE, communeOther: "Hai El Badr" });
    expect(other.data?.commune).toBe("Hai El Badr");
    expect(orderSchema.safeParse({ ...base, commune: OTHER_COMMUNE }).success).toBe(false);
  });

  it("cadeau depuis l'étranger : coordonnées de l'acheteur obligatoires, numéro international", () => {
    expect(normalizeIntlPhone("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizeIntlPhone("0044 7700 900123")).toBe("+447700900123");
    expect(normalizeIntlPhone("0612345678")).toBeNull();

    const missing = orderSchema.safeParse({ ...base, gift: "on" });
    expect(missing.error?.issues.map((i) => i.message).sort()).toEqual(["buyerName", "buyerPhone"]);

    const ok = orderSchema.safeParse({ ...base, gift: "on", buyerName: "Amina Exp", buyerPhone: "+33 6 12 34 56 78", buyerEmail: "amina@example.com", giftMessage: "Joyeux anniversaire" });
    expect(ok.data?.buyer).toEqual({ name: "Amina Exp", phone: "+33612345678", email: "amina@example.com" });
    expect(ok.data?.giftMessage).toBe("Joyeux anniversaire");
    expect(ok.data?.phone).toBe("0555123456");

    expect(orderSchema.safeParse({ ...base, gift: "on", buyerName: "Amina", buyerPhone: "+33612345678", buyerEmail: "pas-un-mail" }).success).toBe(false);
    // Erreurs « cadeau » visibles même quand le reste du formulaire est vide.
    expect(giftFieldErrors({ gift: "on", buyerPhone: "123" })).toEqual({ buyerName: "buyerName", buyerPhone: "buyerPhone" });
    expect(giftFieldErrors({ buyerPhone: "123" })).toEqual({});
    // Sans la case cadeau, les champs acheteur sont ignorés.
    expect(orderSchema.safeParse({ ...base, buyerName: "x", giftMessage: "y" }).data).toMatchObject({ buyer: null, giftMessage: "" });
  });
});
