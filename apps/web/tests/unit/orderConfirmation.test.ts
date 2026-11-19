import { describe, expect, it } from "vitest";
import { confirmationLink, confirmationMessage, waNumber, type ConfirmationInput } from "../../src/lib/admin/orderConfirmation";

const base: ConfirmationInput = {
  number: "DK-ABC123",
  locale: "fr",
  fullName: "Amina Benali",
  phone: "0771 23 45 67",
  items: [{ quantity: 1, names: { fr: "Kit portrait en fil", ar: "طقم بورتريه بالخيط", en: "String portrait kit" } }],
  totalMinor: 390000,
  currency: "DZD",
  wilaya: "16",
};

describe("confirmation WhatsApp des commandes", () => {
  it("numéro algérien converti au format +213 pour wa.me", () => {
    expect(waNumber("0771234567")).toBe("213771234567");
    expect(waNumber("+213 5 51 23 45 67")).toBe("213551234567");
    expect(waNumber("00213661234567")).toBe("213661234567");
    expect(waNumber("+33 6 12 34 56 78")).toBe("33612345678");
    expect(waNumber("12")).toBeNull();
    expect(waNumber("")).toBeNull();
  });

  it("message en français : prénom, kit, prix, wilaya, demande de confirmation", () => {
    const m = confirmationMessage(base);
    expect(m).toContain("Bonjour Amina,");
    expect(m).not.toContain("Benali");
    expect(m).toContain("1 × Kit portrait en fil");
    expect(m).toMatch(/Total : 3\s900 DA/);
    expect(m).toContain("Wilaya : Alger");
    expect(m).toContain("DK-ABC123");
    expect(m).toContain("confirmer");
  });

  it("message en arabe pour une commande passée en arabe", () => {
    const m = confirmationMessage({ ...base, locale: "ar" });
    expect(m).toContain("السلام عليكم Amina");
    expect(m).toContain("طقم بورتريه بالخيط");
    expect(m).toContain("الجزائر");
    expect(m).toContain("تؤكد");
  });

  it("signale les frais de livraison encore inconnus et le cadeau", () => {
    const m = confirmationMessage({ ...base, deliveryPending: true, giftRecipient: "Karim" });
    expect(m).toContain("+ livraison");
    expect(m).toContain("cadeau pour Karim");
  });

  it("lien wa.me complet, ou rien si le numéro est inutilisable", () => {
    const link = confirmationLink(base)!;
    expect(link.startsWith("https://wa.me/213771234567?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(confirmationMessage(base));
    expect(confirmationLink({ ...base, phone: "abc" })).toBeNull();
  });
});
