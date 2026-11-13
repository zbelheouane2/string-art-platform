import { NextResponse } from "next/server";
import { choosePortrait } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Valide le portrait choisi : le code devient « utilisé » et le guide s'ouvre. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const codeId = await currentCodeId();
  if (!codeId) return NextResponse.json({ error: "noSession" }, { status: 401 });
  const { id } = await params;
  const ok = await choosePortrait(codeId, id);
  return ok ? NextResponse.json({ id }) : NextResponse.json({ error: "notFound" }, { status: 404 });
}
