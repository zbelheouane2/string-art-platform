/**
 * Les 1 541 communes d'Algérie, rangées par wilaya selon le découpage à
 * 69 wilayas (loi n° 26-06 du 4 avril 2026). Noms français selon le Journal
 * officiel, noms arabes associés commune par commune.
 *
 * Sources : « Découpage administratif de l'Algérie » (H. Oussama, ODbL 1.0,
 * github.com/oussamidat/algerie-decoupage-administratif) et
 * othmanus/algeria-cities pour les noms arabes. Régénérer avec
 * scripts/build-communes.py si le découpage change.
 */
import data from "./communes.json";

export type Commune = readonly [fr: string, ar: string];

const COMMUNES = data as unknown as Record<string, Commune[]>;

/** Valeur envoyée quand la commune n'est pas dans la liste (saisie libre). */
export const OTHER_COMMUNE = "__autre";

export function communesOf(wilaya: string): readonly Commune[] {
  return COMMUNES[wilaya] ?? [];
}

export function isCommuneOf(wilaya: string, name: string): boolean {
  return communesOf(wilaya).some(([fr]) => fr === name);
}

export function communeCount(): number {
  return Object.values(COMMUNES).reduce((n, list) => n + list.length, 0);
}
