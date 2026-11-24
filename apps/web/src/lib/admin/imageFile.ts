/** Vérification des images téléversées dans l'admin : vrai format (octets d'en-tête), poids. */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Message d'erreur en français, ou null si l'image est acceptée. */
export function checkImage(size: number, bytes: Uint8Array): string | null {
  if (size === 0) return "Choisissez une image.";
  if (size > MAX_IMAGE_BYTES) return "Image trop lourde (3 Mo au plus). Réduisez-la puis réessayez.";
  if (!sniffImage(bytes)) return "Format accepté : JPEG, PNG ou WebP.";
  return null;
}

/** Adresse publique d'une image de la médiathèque. */
export const mediaUrl = (id: string) => `/media/${id}`;
export const MEDIA_URL_RE = /^\/media\/[a-z0-9]{20,40}$/;
/** Adresse acceptée pour une image du site : image d'origine (/visuels/…) ou de la médiathèque. */
export const SITE_IMAGE_RE = /^(\/visuels\/[a-z0-9/_-]+\.(webp|jpg|png)|\/media\/[a-z0-9]{20,40})$/;
