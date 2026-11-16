import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseRateFile } from "@/lib/shipping/rateFile";
import { rateFileToCsv } from "@/lib/shipping/spreadsheet";
import { diffRates } from "@/lib/shipping/saveRates";

describe("import des tarifs depuis Excel", () => {
  it("lit la première feuille (wilaya, domicile, bureau) et calcule l'aperçu des changements", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Tarifs");
    ws.addRow(["Wilaya", "Domicile", "Bureau"]);
    ws.addRow(["16 - Alger", 400, 250]);
    ws.addRow(["Blida", 600, null]);
    const buf = await wb.xlsx.writeBuffer();
    const csv = await rateFileToCsv("tarifs.xlsx", buf as ArrayBuffer);
    const parsed = parseRateFile(csv);
    expect(parsed).toEqual({ ok: true, rows: [{ zone: "16", home: 400, desk: 250 }, { zone: "09", home: 600, desk: null }] });
    if (!parsed.ok) return;
    const current = new Map([["16", { home: 400, desk: 300 }]]);
    expect(diffRates(current, parsed.rows)).toEqual([
      { zone: "09", kind: "home", before: null, after: 600 },
      { zone: "16", kind: "desk", before: 300, after: 250 },
    ]);
  });
});
