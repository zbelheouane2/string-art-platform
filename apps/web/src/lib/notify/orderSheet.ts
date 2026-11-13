import "server-only";
import { wilayaName } from "@/config/wilayas";

/**
 * Envoi de chaque nouvelle commande vers la Google Sheet du propriétaire, via
 * un script Google Apps Script publié en « application Web »
 * (docs/commandes-google-sheet.md). Sans ORDER_SHEET_URL, rien n'est envoyé.
 * Un échec n'empêche jamais la commande : elle reste en base et l'échec est journalisé.
 */
export interface OrderRow {
  number: string;
  createdAt: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  delivery: string;
  payment: string;
  quantity: number;
  total: number;
  currency: string;
  note: string;
  locale: string;
}

export function orderRow(input: Omit<OrderRow, "wilaya"> & { wilayaCode: string }): OrderRow {
  const { wilayaCode, ...rest } = input;
  return { ...rest, wilaya: `${wilayaCode} - ${wilayaName(wilayaCode, "fr") ?? ""}` };
}

export async function sendOrderToSheet(row: OrderRow, timeoutMs = 8000): Promise<"sent" | "disabled" | "failed"> {
  const url = process.env.ORDER_SHEET_URL;
  if (!url) return "disabled";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.ORDER_SHEET_SECRET ?? "", order: row }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    const body = await res.text();
    return res.ok && body.includes('"ok":true') ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
