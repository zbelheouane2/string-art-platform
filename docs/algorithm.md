# Moteur String Art — décisions et état

_Mis à jour : 2026-11-12 — version moteur 0.1.0 (prototype phase 1a). Étude complète : `docs/reverse-engineering/04-algorithm-study.md`._

## Géométrie (validée)
- Planche 500 × 500 mm, cercle de clous Ø 470 mm (**à confirmer par le prototype physique**), 240 clous, pas ≈ 6,15 mm.
- Secteurs A, B, C, D de 60 clous, sens horaire, **A1 à 9 h**, fonds alternés noir/blanc. Index interne 0–239.
- Décalage d'un demi-pas : la frontière entre secteurs tombe entre deux clous (A60 | B1 à 12 h).
- Fichier : `services/engine/boards/board-50x50-240-v1.json` (toute évolution = nouveau fichier versionné).

## Algorithme (v0.1.0)
1. Recadrage carré → 500 px, luminance Rec.709, normalisation percentiles 1–99, CLAHE, gamma, masque disque.
2. Pondération visage (OpenCV Haar) optionnelle.
3. Glouton : depuis le clou courant, segment de plus forte noirceur résiduelle **moyenne** ; retrait de `line_weight` sur ses pixels ; écart minimal 20 clous ; aucun segment répété ; 3 derniers clous interdits.
4. Arrêt : 3 500 fils maximum **ou** plus aucun segment n'améliore le résultat.
5. Rendu : grille ×3, fil 0,12 mm, opacité 0,95, accumulation 1 − (1 − a)ⁿ, moyenne → 1 000 px.

## Constat important du prototype
Avec un modèle physique cohérent (le poids du fil dans l'algorithme = sa couverture réelle d'un pixel), **l'algorithme s'arrête de lui-même entre 1 700 et 2 300 fils** pour un fil de 0,12 mm : au-delà, il assombrirait l'image. Les 3 500 fils de la référence impliquent un fil plus fin ou un rendu plus sombre. **Le nombre de fils doit être calibré avec l'épaisseur réelle du fil choisi**, sur la planche physique (phase 1c).

## Limites connues
- Petit « trou » au centre (≈ 1,5 mm de rayon) : aucune corde ne passe exactement par le centre sauf les diamètres. C'est aussi vrai physiquement.
- Pas encore de raffinement (anticipation, recherche locale), ni de traitement de l'arrière-plan.
- Le fil est modélisé passant par le centre des clous (pas de tangence).
