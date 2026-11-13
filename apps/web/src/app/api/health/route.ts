import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { engineHealth } from "@/lib/engine";

export const dynamic = "force-dynamic";

/** État des dépendances : base de données et moteur. Ne renvoie aucune donnée privée. */
export async function GET() {
  const [database, engine] = await Promise.allSettled([db().$queryRaw`SELECT 1`, engineHealth()]);
  const body = {
    status: database.status === "fulfilled" && engine.status === "fulfilled" ? "ok" : "degraded",
    database: database.status === "fulfilled" ? "ok" : "unavailable",
    engine: engine.status === "fulfilled" ? { status: "ok", version: engine.value.engine_version } : { status: "unavailable" },
  };
  return NextResponse.json(body, { status: body.status === "ok" ? 200 : 503 });
}
