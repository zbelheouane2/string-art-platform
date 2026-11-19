import { NextResponse } from "next/server";
import { saveGuideStep } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Avancement du guide ({ step }) : enregistré pour le code ouvert sur cet
 * appareil, afin de reprendre au même fil sur un autre téléphone.
 * Accepte aussi les envois de fermeture de page (navigator.sendBeacon).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const codeId = await currentCodeId();
  if (!codeId) return NextResponse.json({ error: "noSession" }, { status: 401 });
  const { id } = await params;
  const text = await req.text().catch(() => "");
  let step = Number.NaN;
  try {
    step = Number((JSON.parse(text.slice(0, 200)) as { step?: unknown }).step);
  } catch {
    /* corps invalide */
  }
  if (!Number.isInteger(step) || step < 0) return NextResponse.json({ error: "step" }, { status: 400 });
  const ok = await saveGuideStep(codeId, id, step);
  return ok ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "notFound" }, { status: 404 });
}
