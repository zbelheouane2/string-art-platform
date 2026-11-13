import "server-only";

/** Client du service moteur. Appelé uniquement côté serveur (le jeton ne part jamais au navigateur). */
const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

function headers(): HeadersInit {
  const token = process.env.ENGINE_TOKEN;
  return token ? { "X-Engine-Token": token } : {};
}

export interface EngineHealth {
  status: "ok";
  engine_version: string;
}

export async function engineHealth(timeoutMs = 2000): Promise<EngineHealth> {
  const res = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw new Error(`moteur indisponible (${res.status})`);
  return res.json();
}

export interface GenerationRequest {
  photo: Blob;
  variant?: "doux" | "standard" | "contraste";
  crop?: [number, number, number];
  background?: "light" | "keep";
  previewSize?: number;
}

export interface GenerationResult {
  document: Record<string, unknown> & { sequence: number[]; summary: { lines: number; thread_length_m: number } };
  preview_png_base64: string;
}

export async function generate(req: GenerationRequest, timeoutMs = 60000): Promise<GenerationResult> {
  const form = new FormData();
  form.set("photo", req.photo);
  form.set("variant", req.variant ?? "standard");
  form.set("background", req.background ?? "light");
  if (req.crop) form.set("crop", req.crop.join(","));
  if (req.previewSize) form.set("preview_size", String(req.previewSize));
  const res = await fetch(`${ENGINE_URL}/v1/generations`, {
    method: "POST",
    body: form,
    headers: headers(),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new EngineError(res.status, typeof detail?.detail === "string" ? detail.detail : "erreur du moteur");
  }
  return res.json();
}

export class EngineError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
