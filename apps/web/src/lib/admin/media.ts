import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { checkImage, mediaUrl, sniffImage } from "./imageFile";

/** Enregistre une image téléversée (vérifiée) ; renvoie son adresse publique, ou un message d'erreur. */
export async function storeImage(file: FormDataEntryValue | null, actor: string): Promise<{ url: string } | { error: string }> {
  if (!(file instanceof File)) return { error: "Choisissez une image." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const err = checkImage(file.size, bytes);
  if (err) return { error: err };
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const existing = await db().mediaAsset.findFirst({ where: { sha256 }, select: { id: true } });
  if (existing) return { url: mediaUrl(existing.id) };
  const a = await db().mediaAsset.create({ data: { mime: sniffImage(bytes)!, bytes, size: bytes.length, sha256, name: file.name.slice(0, 120), createdBy: actor } });
  return { url: mediaUrl(a.id) };
}
