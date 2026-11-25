import { describe, expect, it } from "vitest";
import { pickClientIp, DEFAULT_TRUSTED_HEADER } from "@/lib/clientIpPick";
import { sheetSafe, sheetScript, SHEET_SCRIPT_VERSION } from "@/lib/notify/sheetScript";
import { sniffImage } from "@/lib/admin/imageFile";

const hdrs = (h: Record<string, string>) => (name: string) => h[name] ?? null;

describe("adresse IP du visiteur (limites d'essais)", () => {
  it("ignore le début de X-Forwarded-For, que le visiteur écrit lui-même", () => {
    // Le pirate envoie « 1.2.3.4 » ; le relais ajoute la vraie adresse à la fin.
    expect(pickClientIp(hdrs({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" }))).toBe("203.0.113.9");
    expect(pickClientIp(hdrs({ "x-forwarded-for": "5.6.7.8, 1.2.3.4, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("préfère l'en-tête du relais de confiance (Cloudflare devant Render)", () => {
    const h = hdrs({ "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "1.2.3.4, 104.22.17.40" });
    expect(pickClientIp(h, DEFAULT_TRUSTED_HEADER)).toBe("198.51.100.7");
    expect(pickClientIp(h, "none")).toBe("104.22.17.40");
  });

  it("retombe sur X-Forwarded-For puis X-Real-IP si l'en-tête de confiance manque", () => {
    expect(pickClientIp(hdrs({ "x-forwarded-for": "203.0.113.9" }), DEFAULT_TRUSTED_HEADER)).toBe("203.0.113.9");
    expect(pickClientIp(hdrs({ "x-real-ip": "203.0.113.10" }), DEFAULT_TRUSTED_HEADER)).toBe("203.0.113.10");
    expect(pickClientIp(hdrs({}))).toBe("unknown");
  });
});

describe("Google Sheets : pas de formule venant d'un client", () => {
  it("neutralise les textes qui commencent par = + - @", () => {
    for (const v of ['=HYPERLINK("https://evil.example";"Cliquez")', "+1+1", "-2+3", "@SUM(A1)", "\t=1"]) expect(sheetSafe(v)).toBe(`'${v}`);
  });

  it("laisse les textes ordinaires intacts", () => {
    for (const v of ["Amina Benali", "Alger centre", "", "12 rue Didouche", "Joyeux anniversaire = bonheur"]) expect(sheetSafe(v)).toBe(v);
  });

  it("le script neutralise aussi (protège les anciennes feuilles) sans doubler l'apostrophe", () => {
    const s = sheetScript("secret-de-test-1234");
    expect(SHEET_SCRIPT_VERSION).toBe(3);
    expect(s).toContain("function cell(k, v)");
    expect(s).toContain('/^[=+@\\t\\r-]/');
    // Exécute la fonction cell du script généré.
    const cell = new Function(`const TEXT_COLUMNS = ["phone", "buyerPhone"]; ${s.slice(s.indexOf("function cell"), s.indexOf("function json"))}; return cell;`)() as (k: string, v: unknown) => unknown;
    expect(cell("fullName", "=IMAGE(1)")).toBe("'=IMAGE(1)");
    expect(cell("fullName", "'=IMAGE(1)")).toBe("'=IMAGE(1)");
    expect(cell("phone", "0555123456")).toBe("'0555123456");
    expect(cell("buyerPhone", "+33612345678")).toBe("'+33612345678");
    expect(cell("commune", "12 rue")).toBe("12 rue");
    expect(cell("total", 4500)).toBe(4500);
    expect(cell("deliveryFee", null)).toBe("");
  });
});

describe("photo du client : vrai format", () => {
  it("refuse un fichier qui se dit JPEG mais n'en est pas un", () => {
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
  });
});
