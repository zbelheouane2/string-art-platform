import ExcelJS from "exceljs";

/**
 * Transforme un fichier de tarifs envoyé dans l'admin (Excel .xlsx ou CSV)
 * en texte « wilaya;domicile;bureau » lu ensuite par parseRateFile.
 * Excel : première feuille, trois premières colonnes, première ligne = en-têtes.
 */
export async function rateFileToCsv(name: string, bytes: ArrayBuffer): Promise<string> {
  if (/\.xlsx$/i.test(name)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes);
    const sheet = wb.worksheets[0];
    if (!sheet) return "";
    const lines: string[] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells = [1, 2, 3].map((c) => {
        const v = row.getCell(c).value;
        const text = v === null || v === undefined ? "" : typeof v === "object" && "result" in v ? String(v.result ?? "") : String(typeof v === "object" && "text" in v ? v.text : v);
        return text.replace(/;/g, " ").trim();
      });
      lines.push(cells.join(";"));
    });
    return lines.join("\n");
  }
  return new TextDecoder("utf-8").decode(bytes);
}
