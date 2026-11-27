import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/lib/admin/permissions";
import { decodeSession, encodeSession } from "@/lib/admin/session";
import { hashPassword, verifyPassword, LOGIN_RE } from "@/lib/admin/passwords";
import { applyOverrides, checkEditedText, flattenMessages, placeholders } from "@/lib/contentTools";
import { pickAnnouncement, type Announcement } from "@/lib/settingsSchemas";
import { checkImage, sniffImage, SITE_IMAGE_RE } from "@/lib/admin/imageFile";
import { groupCustomers } from "@/lib/admin/customerGroups";
import { computeStats } from "@/lib/admin/statsCalc";
import { displayName, reviewSchema } from "@/lib/reviewRules";
import { sheetScript, SHEET_COLUMNS, SHEET_URL_RE } from "@/lib/notify/sheetScript";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

describe("rôles de l'admin", () => {
  it("l'employé traite commandes, stock, avis, annonce et FAQ, rien d'autre", () => {
    const employee = Object.keys(PERMISSIONS).filter((p) => can("EMPLOYEE", p as keyof typeof PERMISSIONS));
    expect(employee.sort()).toEqual(["announcement", "dashboard", "faq", "orders", "reviews", "stock"]);
  });
  it("l'administrateur a tous les droits", () => {
    for (const p of Object.keys(PERMISSIONS)) expect(can("ADMIN", p as keyof typeof PERMISSIONS)).toBe(true);
  });
});

describe("session admin signée", () => {
  const secret = "x".repeat(40);
  it("relit qui est connecté, refuse un jeton modifié ou expiré", () => {
    const now = Date.now();
    const token = encodeSession({ uid: "u1", role: "EMPLOYEE", v: 2 }, secret, now);
    expect(decodeSession(token, secret, now)).toMatchObject({ uid: "u1", role: "EMPLOYEE", v: 2 });
    // Se donner le rôle ADMIN casse la signature.
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), role: "ADMIN" })).toString("base64url");
    expect(decodeSession(`${forged}.${sig}`, secret, now)).toBeNull();
    expect(decodeSession(token, "y".repeat(40), now)).toBeNull();
    expect(decodeSession(token, secret, now + 13 * 3_600_000)).toBeNull();
    expect(decodeSession(undefined, secret)).toBeNull();
  });
});

describe("mots de passe des comptes", () => {
  it("empreinte salée, vérifiée, jamais en clair", () => {
    const h = hashPassword("motdepasse-123");
    expect(h).not.toContain("motdepasse");
    expect(hashPassword("motdepasse-123")).not.toBe(h);
    expect(verifyPassword("motdepasse-123", h)).toBe(true);
    expect(verifyPassword("motdepasse-124", h)).toBe(false);
    expect(verifyPassword("x", "abîmé")).toBe(false);
  });
  it("identifiants simples", () => {
    expect(LOGIN_RE.test("karim")).toBe(true);
    expect(LOGIN_RE.test("sara.dz")).toBe(true);
    expect(LOGIN_RE.test("Ka")).toBe(false);
    expect(LOGIN_RE.test("a b c")).toBe(false);
  });
});

describe("textes du site modifiables", () => {
  it("les trois langues ont les mêmes clés (l'éditeur les montre côte à côte)", () => {
    const k = (m: object) => Object.keys(flattenMessages(m)).sort();
    expect(k(ar)).toEqual(k(fr));
    expect(k(en)).toEqual(k(fr));
  });
  it("remplace une clé, y compris dans une liste, sans toucher l'original", () => {
    const base = { a: { b: "x", list: [{ h: "titre" }] } };
    const out = applyOverrides(base, [
      { key: "a.b", value: "y" },
      { key: "a.list.0.h", value: "nouveau" },
      { key: "inconnue.cle", value: "z" },
    ]);
    expect(out).toEqual({ a: { b: "y", list: [{ h: "nouveau" }] } });
    expect(base.a.b).toBe("x");
  });
  it("refuse un texte qui perd ses variables ou casse les accolades", () => {
    expect(placeholders("{count, plural, one {# kit} other {# kits}}")).toEqual(["count"]);
    expect(checkEditedText("Bonjour {brand}", "Salut {brand} !")).toBeNull();
    expect(checkEditedText("Bonjour {brand}", "Salut !")).toContain("{brand}");
    expect(checkEditedText("Bonjour", "Salut {nom}")).toContain("{nom}");
    expect(checkEditedText("Bonjour", "Salut {")).toContain("Accolades");
    expect(checkEditedText("{count, plural, one {# kit} other {# kits}}", "{count} kits")).toContain("plural");
  });
});

describe("bande d'annonce", () => {
  const a: Announcement = {
    base: { fr: "Livraison partout", en: "", ar: "" },
    hidden: false,
    scheduled: [{ id: "1", label: "Aïd", texts: { fr: "Aïd : −10 %", en: "Eid: −10%", ar: "" }, startsAt: "2026-03-18T23:00:00Z", endsAt: "2026-03-22T22:59:59Z", active: true }],
  };
  it("message programmé pendant ses dates, sinon permanent, sinon texte d'origine", () => {
    expect(pickAnnouncement(a, "fr", new Date("2026-03-20T12:00:00Z")).text).toBe("Aïd : −10 %");
    expect(pickAnnouncement(a, "fr", new Date("2026-04-01T12:00:00Z")).text).toBe("Livraison partout");
    expect(pickAnnouncement(a, "en", new Date("2026-04-01T12:00:00Z")).text).toBeNull();
    // Pas de texte arabe programmé : on garde le message permanent (vide → texte d'origine).
    expect(pickAnnouncement(a, "ar", new Date("2026-03-20T12:00:00Z")).text).toBeNull();
    expect(pickAnnouncement({ ...a, hidden: true }, "fr").hidden).toBe(true);
  });
});

describe("images téléversées", () => {
  it("reconnaît le vrai format, refuse le reste", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImage(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(checkImage(20, new TextEncoder().encode("<svg onload=alert(1)>"))).toContain("Format");
    expect(checkImage(4 * 1024 * 1024, new Uint8Array([0xff, 0xd8, 0xff]))).toContain("3 Mo");
    expect(SITE_IMAGE_RE.test("/media/clx0abcdefghijklmnopqrs")).toBe(true);
    expect(SITE_IMAGE_RE.test("https://exemple.com/x.png")).toBe(false);
  });
});

describe("clients, statistiques, avis", () => {
  const d = (s: string) => new Date(s);
  const orders = [
    { number: "DK-AAAAAA", fullName: "Amina B", phone: "0555123456", email: null, wilaya: "16", status: "DELIVERED", totalMinor: 490000, createdAt: d("2026-11-01T10:00:00Z") },
    { number: "DK-BBBBBB", fullName: "Amina Benali", phone: "0555 12 34 56", email: "a@x.dz", wilaya: "09", status: "CANCELLED", totalMinor: 490000, createdAt: d("2026-11-10T10:00:00Z") },
    { number: "DK-CCCCCC", fullName: "Yacine", phone: "0661000000", email: null, wilaya: "31", status: "PENDING", totalMinor: 530000, createdAt: d("2026-11-05T10:00:00Z") },
  ];
  it("une fiche par téléphone, annulations non comptées", () => {
    const c = groupCustomers(orders);
    expect(c).toHaveLength(2);
    expect(c[0]).toMatchObject({ fullName: "Amina Benali", orders: 2, spentMinor: 490000, lastNumber: "DK-BBBBBB", email: "a@x.dz", wilaya: "09" });
  });
  it("chiffres de la période", () => {
    const s = computeStats(
      orders.map((o) => ({ ...o, promoCode: o.number === "DK-CCCCCC" ? "BIENVENUE" : null, items: [{ kind: "KIT", name: "Kit", quantity: 1 }] })),
      30,
      d("2026-11-24T12:00:00Z"),
    );
    expect(s.orders).toBe(3);
    expect(s.revenue).toBe(1_020_000);
    expect(s.kits).toBe(2);
    expect(s.average).toBe(510_000);
    expect(s.confirmRate).toBe(50);
    expect(s.perDay).toHaveLength(30);
    expect(s.perDay.reduce((a, x) => a + x.orders, 0)).toBe(3);
    expect(s.byPromo).toEqual([["BIENVENUE", 1]]);
  });
  it("avis : prénom seulement, texte vérifié", () => {
    expect(displayName("Amina Benali")).toBe("Amina B.");
    expect(displayName("  Yacine ")).toBe("Yacine");
    expect(reviewSchema.safeParse({ name: "Amina", rating: "5", text: "Superbe cadeau !" }).success).toBe(true);
    expect(reviewSchema.safeParse({ name: "Amina", rating: "6", text: "Superbe cadeau !" }).success).toBe(false);
    expect(reviewSchema.safeParse({ name: "A", rating: "5", text: "court" }).success).toBe(false);
  });
});

describe("script Google Sheets", () => {
  it("contient le mot secret (échappé), les colonnes et les trois types de messages", () => {
    const s = sheetScript('abc"def');
    expect(s).toContain('const SECRET = "abc\\"def";');
    for (const [k] of SHEET_COLUMNS) expect(s).toContain(`"${k}"`);
    expect(s).toContain('data.type === "test"');
    expect(s).toContain('data.type === "status"');
    expect(SHEET_URL_RE.test("https://script.google.com/macros/s/AKfycbx123456789/exec")).toBe(true);
    expect(SHEET_URL_RE.test("https://evil.example/exec")).toBe(false);
  });
});
