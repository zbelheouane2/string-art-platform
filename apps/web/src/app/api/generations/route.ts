import { NextResponse } from "next/server";
import { createPortrait, VARIANTS, type PortraitError, type Variant } from "@/lib/portraits";
import { currentCodeId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

/** Calcule un portrait à partir de la photo envoyée (code ouvert obligatoire). */
export async function POST(req: Request) {
  const codeId = await currentCodeId();
  if (!codeId) return NextResponse.json({ error: "noSession" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ error: "fileType" }, { status: 415 });
  const variantRaw = String(form?.get("variant") ?? "standard");
  const variant: Variant = (VARIANTS as readonly string[]).includes(variantRaw) ? (variantRaw as Variant) : "standard";
  const background = form?.get("background") === "keep" ? "keep" : "light";

  const result = await createPortrait(codeId, photo, { variant, background });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: STATUS[result.error] });
  return NextResponse.json(result.portrait, { headers: { "Cache-Control": "no-store" } });
}
