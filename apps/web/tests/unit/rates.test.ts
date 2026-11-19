import { describe, expect, it } from "vitest";
import { parseRateFile, wilayaCode } from "@/lib/shipping/rateFile";
import { commerce } from "@/config/commerce";
import { NOT_SERVED, deliveryFee } from "@/lib/shipping/fee";

describe("fichier de tarifs de livraison", () => {
  it("reconnaît la wilaya par numéro, numéro + nom, nom français ou arabe", () => {
    expect(wilayaCode("16")).toBe("16");
    expect(wilayaCode("9")).toBe("09");
    expect(wilayaCode("06 - Béjaïa")).toBe("06");
    expect(wilayaCode("bejaia")).toBe("06");
    expect(wilayaCode("بسكرة")).toBe("07");
    expect(wilayaCode("Bou Saâda")).toBe("68");
    expect(wilayaCode("70")).toBeNull();
    expect(wilayaCode("Paris")).toBeNull();
  });

  it("lit un export Excel (point-virgule, BOM, « DA », cellules vides)", () => {
    const r = parseRateFile("﻿wilaya;domicile;bureau\r\n16 - Alger;400 DA;250\r\n01;1 400;\r\n");
    expect(r).toEqual({ ok: true, rows: [{ zone: "16", home: 400, desk: 250 }, { zone: "01", home: 1400, desk: null }] });
  });

  it("lit un export Google Sheets (virgule)", () => {
    expect(parseRateFile("wilaya,domicile,bureau\n31,700,450\n")).toEqual({ ok: true, rows: [{ zone: "31", home: 700, desk: 450 }] });
  });

  it("signale wilaya inconnue, montant invalide et doublon, avec le numéro de ligne", () => {
    const r = parseRateFile("wilaya;domicile;bureau\nAtlantide;400;300\n16;abc;300\n16;400;300\n16;500;300\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual(["ligne 2 : wilaya inconnue « Atlantide »", "ligne 3 : montant invalide", "ligne 5 : wilaya 16 en double"]);
  });

  it("le modèle fourni contient les 69 wilayas et s'importe tel quel", async () => {
    const { readFileSync } = await import("node:fs");
    const r = parseRateFile(readFileSync("prisma/data/tarifs-livraison-modele.csv", "utf-8"));
    expect(r.ok && r.rows.length).toBe(69);
  });
});

describe("frais de livraison d'une wilaya", () => {
  const rates = { zr_home: { "16": 50_000, "01": 140_000 }, zr_desk: { "16": 36_000 }, other_home: {} };
  it("tarif saisi : son montant", () => {
    expect(deliveryFee(rates, "zr_home", "16")).toBe(50_000);
    expect(deliveryFee(rates, "zr_desk", "16")).toBe(36_000);
  });
  it("grille saisie mais wilaya absente : non desservie", () => {
    expect(deliveryFee(rates, "zr_home", "33")).toBe(NOT_SERVED);
    expect(deliveryFee(rates, "zr_desk", "01")).toBe(NOT_SERVED); // bureau absent, domicile possible
  });
  it("aucune grille pour ce mode : frais par défaut en attendant l'import", () => {
    expect(deliveryFee(rates, "other_home", "33")).toBe(commerce.missingRateFeeMinor);
    expect(deliveryFee(rates, "inconnu", "16")).toBe(commerce.missingRateFeeMinor);
  });
});
