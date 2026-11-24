import "server-only";
import ExcelJS from "exceljs";

/** Classeur Excel d'une seule feuille, en-têtes en gras, colonnes à largeur raisonnable. */
export async function xlsxResponse(fileName: string, sheet: string, headers: string[], rows: (string | number | null)[][]): Promise<Response> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheet);
  ws.addRow(headers).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  ws.columns.forEach((c, i) => {
    c.width = Math.min(40, Math.max(10, headers[i].length + 2, ...rows.slice(0, 200).map((r) => String(r[i] ?? "").length + 2)));
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
