import { describe, expect, it } from "vitest";
import { displayPhone, ltr, socialLinks, whatsappUrl } from "../../src/lib/contact";

describe("contact", () => {
  it("lien WhatsApp à partir du numéro international", () => {
    expect(whatsappUrl("213771704033")).toBe("https://wa.me/213771704033");
    expect(whatsappUrl("+213 771 70 40 33", "Bonjour")).toBe("https://wa.me/213771704033?text=Bonjour");
    expect(whatsappUrl("")).toBeNull();
  });

  it("numéro algérien affiché au format local", () => {
    expect(displayPhone("213771704033")).toBe("0771 70 40 33");
    expect(displayPhone("33612345678")).toBe("+33612345678");
    expect(displayPhone("")).toBe("");
  });

  it("isole le numéro dans une phrase de droite à gauche", () => {
    expect(ltr("0771 70 40 33")).toBe("⁦0771 70 40 33⁩");
    expect(ltr("")).toBe("");
  });

  it("réseaux : seuls les liens https renseignés sont gardés", () => {
    expect(socialLinks({ instagram: "", facebook: "https://facebook.com/deekra", tiktok: "javascript:alert(1)" })).toEqual([
      { key: "facebook", url: "https://facebook.com/deekra" },
    ]);
  });
});
