import { db } from "@/lib/db";

/** Images de la médiathèque de l'admin (photos du site, avant/après, avis) : publiques, jamais modifiées. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Introuvable", { status: 404 });
  const a = await db().mediaAsset.findUnique({ where: { id }, select: { mime: true, bytes: true } });
  if (!a) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(a.bytes), {
    headers: { "Content-Type": a.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
