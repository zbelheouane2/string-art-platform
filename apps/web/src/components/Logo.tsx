import { brand } from "@/config/brand";

/**
 * Logo « Deekra — L'art du fil » (tête en fils et nom calligraphié, fond transparent).
 * `tone="dark"` : version éclaircie pour les fonds sombres (pied de page), chargée en différé.
 * Fichiers à 220 px de haut (2 × l'affichage).
 */
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <img
      className="logo"
      src={tone === "dark" ? brand.logo.dark : brand.logo.light}
      alt={brand.name}
      width={brand.logo.width}
      height={brand.logo.height}
      decoding="async"
      loading={tone === "dark" ? "lazy" : undefined}
    />
  );
}
