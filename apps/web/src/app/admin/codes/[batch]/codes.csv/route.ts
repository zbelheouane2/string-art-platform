import { isAdmin } from "@/lib/admin/auth";
import { BATCH_RE, codeBatchCsv } from "@/lib/admin/codeBatches";
import { db } from "@/lib/db";

/** Codes d'un lot, au format CSV pour l'imprimeur. */
export async function GET(_: Request, { params }: { params: Promise<{ batch: string }> }) {
  if (!(await isAdmin("codes"))) return new Response("Non autorisé", { status: 401 });
  const { batch } = await params;
  if (!BATCH_RE.test(batch)) return new Response("Introuvable", { status: 404 });
  const csv = await codeBatchCsv(db(), batch);
  if (!csv) return new Response("Introuvable", { status: 404 });
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="codes-${batch}.csv"`, "Cache-Control": "no-store" },
  });
}
