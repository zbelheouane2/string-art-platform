/**
 * Script Google Apps Script à coller dans la Google Sheet des commandes
 * (version 2). Il reçoit trois sortes de messages du site, tous protégés par
 * le mot secret : « order » (nouvelle ligne), « status » (mise à jour de la
 * colonne Statut) et « test » (vérifie la liaison sans rien écrire).
 */
export const SHEET_SCRIPT_VERSION = 2;

export const SHEET_COLUMNS = [
  ["number", "Commande"],
  ["createdAt", "Date"],
  ["fullName", "Nom"],
  ["phone", "Téléphone"],
  ["wilaya", "Wilaya"],
  ["commune", "Commune"],
  ["delivery", "Livraison"],
  ["payment", "Paiement"],
  ["quantity", "Quantité"],
  ["options", "Options"],
  ["promo", "Code promo"],
  ["discount", "Remise"],
  ["deliveryFee", "Frais de livraison"],
  ["total", "Total"],
  ["currency", "Devise"],
  ["note", "Remarque"],
  ["locale", "Langue"],
  ["gift", "Cadeau"],
  ["buyerName", "Acheteur"],
  ["buyerPhone", "Tél. acheteur"],
  ["buyerEmail", "E-mail acheteur"],
  ["giftMessage", "Message cadeau"],
] as const;

/** Échappe une chaîne pour l'écrire entre guillemets dans le script. */
const js = (s: string) => JSON.stringify(s);

export function sheetScript(secret: string): string {
  const keys = SHEET_COLUMNS.map(([k]) => js(k)).join(", ");
  const headers = SHEET_COLUMNS.map(([, h]) => js(h)).join(", ");
  return `// DeeKra : réception des commandes (version ${SHEET_SCRIPT_VERSION}).
const SECRET = ${js(secret || "CHANGEZ-MOI")};
const COLUMNS = [${keys}];
const HEADERS = [${headers}, "Statut"];
const TEXT_COLUMNS = ["phone", "buyerPhone"];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return json({ ok: false, error: "secret" });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (data.type === "test") return json({ ok: true, version: ${SHEET_SCRIPT_VERSION}, sheet: sheet.getName() });
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  if (data.type === "status") {
    const numbers = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    for (let i = numbers.length - 1; i >= 1; i--) {
      if (String(numbers[i][0]) === data.number) {
        sheet.getRange(i + 1, HEADERS.length).setValue(data.status);
        return json({ ok: true, version: ${SHEET_SCRIPT_VERSION} });
      }
    }
    return json({ ok: false, error: "introuvable" });
  }
  const o = data.order;
  // Téléphones en texte pour garder le 0 initial ; frais vides = à confirmer par téléphone.
  const row = COLUMNS.map((k) => (TEXT_COLUMNS.indexOf(k) >= 0 && o[k] ? "'" + o[k] : o[k] === null || o[k] === undefined ? "" : o[k]));
  sheet.appendRow(row.concat([data.status || "À confirmer"]));
  return json({ ok: true, version: ${SHEET_SCRIPT_VERSION} });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
}

/** Adresse plausible d'une application Web Apps Script. */
export const SHEET_URL_RE = /^https:\/\/script\.google(usercontent)?\.com\/[^\s"'<>]{10,380}$/;
