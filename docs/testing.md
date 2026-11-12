# Tests et validations

## Moteur (`services/engine`)
`python -m pytest -q` — 36 tests (2026-11-12, tous verts) :
- Géométrie : 240 clous, repères A1–D60 aller-retour, positions sur le cercle, A1 à 9 h, sens horaire, pas entre clous, cordes.
- Segments : pixels uniques et dans l'image, cache par clou cohérent.
- Prétraitement : bornes 0–1, masque, empreinte SHA-256, refus des images < 400 px, avertissement photo sombre.
- Solveur : écart minimal respecté, aucun segment répété, **déterminisme**, plus de fil dans les zones sombres.
- Visage (v0.2) : détection et repères sur photo réelle, cadrage auto (proportion, reste dans l'image, visage centré), repli centré sans visage, priorité au recadrage manuel, fond éclairci sans toucher au visage, pénalité zones claires, document JSON avec cadrage et visage.
- Instructions : longueur de fil exacte sur un cas simple, cohérence séquence ↔ étapes lisibles.

## Service moteur
`tests/test_api.py` : santé, génération (document + aperçu PNG), refus image trop petite, fichier non image, recadrage invalide, jeton obligatoire si configuré.

## Site (`apps/web`)
- `npm test` — 13 tests unitaires : repères de clous identiques au moteur, cohérence du portrait de démonstration, mêmes clés de traduction dans les trois langues.
- `npm run test:e2e` — 34 tests navigateur (bureau 1440 px et mobile 390 px) : choix de langue selon le navigateur, `lang` et `dir` (RTL en arabe), pas de défilement horizontal, accessibilité WCAG 2.1 A/AA (axe) en FR/EN/AR, sélecteur de langue, tissage complet, FAQ au clavier, santé base + moteur.

## Essais visuels
Photo libre de droits (scikit-image « astronaut », recadrée sur le visage) : portrait reconnaissable, 1 800–2 300 fils, ~0,7–0,9 km de fil, ~1 s de calcul + ~2 s de rendu.

## Banc qualité
`python bench/bench.py <dossier_photos> <dossier_sortie>` : rendu + score de ressemblance global et visage par photo. Résultats v0.1 → v0.2 dans `docs/algorithm.md`.

## À venir
Banc de 30 photos types (phase 1b), comparaison simulation / planche réelle (phase 1c).
