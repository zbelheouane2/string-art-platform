# 07 — Plan de développement progressif

_Chaque phase se termine par un bilan et ta validation avant la suivante (CLAUDE.md §3). Difficulté : ●○○ faible, ●●○ moyenne, ●●● forte._

| # | Phase | Contenu | Dépend de | Difficulté | Livrable / critère de sortie |
|---|---|---|---|---|---|
| 0 | **Cadrage** | Valider l'architecture (05), les décisions (08), la structure du dépôt, le CI et l'outillage de tests | — | ●○○ | Architecture validée |
| 1a | **Moteur : prototype** | `geometry` (240 clous, A1 à D60, mm), `imaging` de base, `solver` glouton vectorisé, rendu simple, export JSON | 0 | ●●○ | Script CLI : photo → séquence + PNG + longueur de fil, en moins de 30 s |
| 1b | **Moteur : qualité** | CLAHE et gamma, carte visage, contrôle des répétitions, variantes, métriques (SSIM, histogramme), banc d'essai sur 30 photos types | 1a | ●●● | Rapport comparatif ; paramètres retenus |
| 1c | **Prototype physique** ⚠ | Fabrication d'une planche de 50 × 50 cm et 240 clous, réalisation de 2 ou 3 portraits, calibrage de l'opacité et de l'épaisseur, mesure du fil et du temps | 1a (fabrication en parallèle de 1b) | ●●● (fabrication) | **Validation que le rendu physique correspond à la simulation** |
| 2 | **Instructions** | PDF (gabarit à l'échelle et séquence), JSON de l'assistant, longueur de fil, voix (enregistrer 64 fichiers × 3 langues) | 1b | ●●○ | PDF imprimable et testé sur la planche |
| 3 | **Générateur web** | Activation par code, import, recadrage, contrôle qualité, variantes, file de génération, résultat | 1b, 2 | ●●○ | Parcours complet sans compte |
| 4 | **Assistant** | PWA, voix, vitesse, musique, sauvegarde automatique, reprise, « je suis perdu », mode mobile | 2, 3 | ●●○ | Un portrait réalisé intégralement avec l'assistant |
| 5 | **Codes et back-office minimal** | Lots, statuts, export imprimeur, anti-force brute, tableau des générations | 3 | ●○○ | Lot de codes imprimable |
| 6 | **Boutique** | Page produit, panier, checkout, paiement à la livraison avec confirmation, carte, transporteurs, emails | 5 | ●●○ | Commande de test de bout en bout (Algérie et UE) |
| 7 | **Internationalisation** | FR/EN/AR et RTL complets, marchés, devises | 3–6 (prévue dès le départ) | ●●○ | Tests RTL |
| 8 | **Préproduction** | Sécurité, performance, tests physiques supplémentaires, mentions légales, déploiement | tout | ●●○ | Lancement |

## Chemin critique
**1a → 1c → 1b → 2.** Tant qu'une planche réelle n'a pas confirmé la qualité, le reste est secondaire. La fabrication de la planche (MDF, perçage ou gabarit, 240 clous) doit démarrer **dès la phase 1a**.

## Risques principaux
| Risque | Impact | Atténuation |
|---|---|---|
| Rendu physique différent de la simulation | Fort | Calibrage sur prototype (1c), métriques floutées |
| Précision de pose des clous | Fort | Gabarit imprimé à l'échelle ou perçage CNC |
| Paiement à la livraison et taux de refus élevé en Algérie | Moyen | Confirmation WhatsApp, acompte éventuel |
| Hébergement imposé en Algérie (loi 18-05) | Moyen | Architecture conteneurisée et portable |
| Qualité des photos clients | Moyen | Contrôle automatique, galerie de modèles |
