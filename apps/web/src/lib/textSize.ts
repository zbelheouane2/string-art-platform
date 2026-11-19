/** Tailles de texte proposées (en % de la taille normale) ; tout le site est en rem. */
export const TEXT_SIZES = [
  { key: "normal", value: 100 },
  { key: "large", value: 115 },
  { key: "xlarge", value: 130 },
  { key: "xxlarge", value: 150 },
] as const;

export const TEXT_SIZE_KEY = "dk-text-size";

export function readTextSize(): number {
  try {
    const v = Number(localStorage.getItem(TEXT_SIZE_KEY));
    return TEXT_SIZES.some((s) => s.value === v) ? v : 100;
  } catch {
    return 100;
  }
}

export function applyTextSize(v: number) {
  document.documentElement.style.fontSize = v === 100 ? "" : `${v}%`;
}

/** Script court exécuté avant l'affichage (pas de saut de mise en page). */
export const TEXT_SIZE_BOOT = `try{var v=+localStorage.getItem("${TEXT_SIZE_KEY}");if([115,130,150].indexOf(v)>-1)document.documentElement.style.fontSize=v+"%"}catch(e){}`;
