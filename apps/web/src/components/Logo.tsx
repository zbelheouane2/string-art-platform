import { brand } from "@/config/brand";

/**
 * Logo calligraphié DeeKra (version d'en-tête, sans « STRING ART »).
 * `tone="dark"` : version claire pour les fonds sombres (pied de page).
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
    />
  );
}
