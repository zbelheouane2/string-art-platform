import { NextResponse } from "next/server";
import { proposeFrame, type PortraitError } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS: Record<PortraitError, number> = {
  noSession: 401,
  used: 409,
  disabled: 403,
  limit: 429,
  fileType: 415,
  fileSize: 413,
  photo: 422,
  engine: 503,
};

/** Cadrage proposé pour la photo choisie (visage centré). Ne consomme pas d'essai. */
export async function POST(req: Request) {
  const codeId = await currentCodeId();
  if (!codeId) return NextResponse.json({ error: "noSession" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ error: "fileType" }, { status: 415 });
  const result = await proposeFrame(codeId, photo);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: STATUS[result.error] });
  return NextResponse.json(result.frame, { headers: { "Cache-Control": "no-store" } });
}
