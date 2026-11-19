import { isAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { currentRates } from "@/lib/shipping/saveRates";
import { WILAYAS } from "@/config/wilayas";

/** Tarifs actuels d'une société, au format du fichier d'import (modèle à remplir). */
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const { code } = await params;
  if (!(await db().carrier.findUnique({ where: { code } }))) return new Response("Introuvable", { status: 404 });
  const rates = await currentRates(db(), code);
  const lines = ["wilaya;domicile;bureau", ...WILAYAS.map((w) => `${w.code} - ${w.fr};${rates.get(w.code)?.home ?? ""};${rates.get(w.code)?.desk ?? ""}`)];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="tarifs-${code}.csv"`, "Cache-Control": "no-store" },
  });
}
