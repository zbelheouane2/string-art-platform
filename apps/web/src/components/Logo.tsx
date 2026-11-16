import { brand } from "@/config/brand";

/**
 * Logo calligraphié DeeKra (version d'en-tête, sans « STRING ART »).
 * `tone="dark"` : version claire pour les fonds sombres (pied de page), chargée en différé.
 * Fichiers à 160 px de haut (2,5 × l'affichage) ; les originaux restent à côté.
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
