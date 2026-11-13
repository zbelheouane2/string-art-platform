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

## Améliorations v0.2.0 (phase 1b)
Mesuré avec `services/engine/bench/bench.py` : ressemblance (SSIM après flou « vue à distance ») entre le rendu et la photo d'origine au même recadrage. Jeu : Beckham (photo fournie, non versionnée), astronaut, camera, chelsea, coffee.

| Changement | Effet mesuré | Retenu |
|---|---|---|
| **Cadrage automatique sur le visage** (YuNet, visage ≈ 50 % du diamètre, centre à 45 % du haut) | Gain visuel le plus net : le visage remplit le cercle au lieu d'être noyé dans la scène (astronaut, camera) | Oui, par défaut (recadrage manuel prioritaire) |
| **Pénalité zones claires** (`light_penalty` 0,2 : résidu initial = noirceur − 0,2 × clarté²) | Ressemblance moyenne +0,035, fond nettement moins voilé | Oui |
| **Fond éclairci** (GrabCut initialisé par le visage, 35 % de la noirceur conservée hors personne) | Fond plus propre visuellement ; métrique neutre (la référence garde le fond) | Oui, `background="light"` ; `"keep"` disponible |
| **Contours renforcés** (masque flou 0,5) | Neutre à légèrement positif | Oui |
| Importance yeux/bouche (repères YuNet) | Pas de gain mesurable, parfois négatif | Non (paramètre `feature_weight`, désactivé) |
| Retrait pondéré par l'importance | Gain non significatif | Non (retiré) |
| Pénalité de surépaisseur (zones déjà sombres) | Arrêt trop précoce, −0,03 à −0,06 | Non (retiré) |

Résultat (variante standard, cadrage auto) : Beckham 0,52 → 0,61 ; camera 0,65 → 0,69 ; chelsea (sans visage) 0,63 → 0,64 ; astronaut 0,63 → 0,62 mais visage cadré et lisible (le score compare des recadrages différents). Planche : `/mnt/project-files/prototype-moteur/avant-apres-v0.2.png`.

Détecteur de visage : YuNet (OpenCV `FaceDetectorYN`, modèle ONNX 230 Ko, licence MIT, fourni dans `stringart/models/`), repli cascade de Haar. Tout est local, aucune photo ne quitte le serveur.

## Constat important du prototype
Avec un modèle physique cohérent (le poids du fil dans l'algorithme = sa couverture réelle d'un pixel), **l'algorithme s'arrête de lui-même entre 1 700 et 2 300 fils** pour un fil de 0,12 mm : au-delà, il assombrirait l'image. Les 3 500 fils de la référence impliquent un fil plus fin ou un rendu plus sombre. **Le nombre de fils doit être calibré avec l'épaisseur réelle du fil choisi**, sur la planche physique (phase 1c).

## Limites connues
- Petit « trou » au centre (≈ 1,5 mm de rayon) : aucune corde ne passe exactement par le centre sauf les diamètres. C'est aussi vrai physiquement.
- Pas encore de raffinement (anticipation, recherche locale).
- Les yeux restent le point faible à 240 clous : les fils sont de longues cordes, le détail fin est limité. Pistes : recherche locale après le glouton, calibrage sur planche réelle.
- Le fond éclairci dépend de GrabCut : sur un fond très proche de la couleur des vêtements ou des cheveux, la séparation peut être imparfaite (le client garde l'option « garder le fond »).
- Le fil est modélisé passant par le centre des clous (pas de tangence).
