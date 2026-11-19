/**
 * Cadrage manuel de la photo : un carré (x, y, côté) en pixels de la photo
 * redressée, toujours entièrement dans l'image (le moteur applique la même règle).
 * Le cercle de la planche est inscrit dans ce carré.
 */
export type Box = { x: number; y: number; side: number };
export type Size = { width: number; height: number };

/** Zoom maximal : le carré peut descendre jusqu'à 1/6 du plus petit côté de la photo. */
export const MAX_ZOOM = 6;

/** Carré central le plus grand possible (cadrage par défaut sans visage). */
export function centeredBox({ width, height }: Size): Box {
  const side = Math.min(width, height);
  return { x: (width - side) / 2, y: (height - side) / 2, side };
}

/** Garde le carré dans l'image et dans les limites de zoom. */
export function clampBox(box: Box, { width, height }: Size): Box {
  const max = Math.min(width, height);
  const side = Math.min(max, Math.max(max / MAX_ZOOM, box.side));
  return {
    x: Math.min(Math.max(0, box.x), width - side),
    y: Math.min(Math.max(0, box.y), height - side),
    side,
  };
}

/** Zoom actuel : 1 = toute la photo (plus petit côté), MAX_ZOOM = gros plan. */
export function zoomOf(box: Box, size: Size): number {
  return Math.min(size.width, size.height) / box.side;
}

/**
 * Change le zoom en gardant fixe le point (fx, fy) du carré, exprimé en
 * fraction du carré (0,5 ; 0,5 = centre, ce que fait le curseur).
 */
export function zoomTo(box: Box, zoom: number, size: Size, fx = 0.5, fy = 0.5): Box {
  const side = Math.min(size.width, size.height) / Math.min(MAX_ZOOM, Math.max(1, zoom));
  const px = box.x + fx * box.side;
  const py = box.y + fy * box.side;
  return clampBox({ x: px - fx * side, y: py - fy * side, side }, size);
}

/** Déplace la photo de (dx, dy) pixels d'écran ; `scale` = pixels d'écran par pixel de photo. */
export function panBy(box: Box, dx: number, dy: number, scale: number, size: Size): Box {
  return clampBox({ x: box.x - dx / scale, y: box.y - dy / scale, side: box.side }, size);
}

/** Valeur envoyée au moteur : « x,y,côté » en pixels entiers. */
export function boxToParam(box: Box): string {
  return [Math.round(box.x), Math.round(box.y), Math.round(box.side)].join(",");
}

/** Lecture côté serveur d'un cadrage reçu (null si absent ou invalide). */
export function parseBoxParam(value: unknown): [number, number, number] | null {
  if (typeof value !== "string" || !/^\d{1,6},\d{1,6},\d{1,6}$/.test(value)) return null;
  const [x, y, side] = value.split(",").map(Number);
  return side >= 64 ? [x, y, side] : null;
}
