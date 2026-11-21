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
- `npm test` — tests unitaires : repères de clous identiques au moteur, cohérence du portrait de démonstration, mêmes clés de traduction dans les trois langues, liens WhatsApp et réseaux (`contact.test.ts`).
- `npm run test:e2e` — 34 tests navigateur (bureau 1440 px et mobile 390 px) : choix de langue selon le navigateur, `lang` et `dir` (RTL en arabe), pas de défilement horizontal, accessibilité WCAG 2.1 A/AA (axe) en FR/EN/AR, sélecteur de langue, tissage complet, FAQ au clavier, santé base + moteur. `infos.spec.ts` : les 4 pages d'information en FR/EN/AR (titre, largeur, accessibilité), liens du pied de page, WhatsApp affiché et réseaux masqués, engagements sous le bouton Commander.

- `seo.test.ts` (unitaires) : versions linguistiques, adresse canonique, aperçu des liens, sitemap, robots, fiche produit schema.org, lecture des identifiants de mesure.
- `seo.spec.ts` (navigateur) : balises Open Graph et hreflang, image d'aperçu de moins de 300 Ko, fiche produit avec le prix, pages personnelles en `noindex`, `robots.txt` et `sitemap.xml`.
- `consent.spec.ts` (navigateur, avec un site construit avec des identifiants de test et `ANALYTICS_E2E=1`) : rien n'est chargé avant l'accord, refus mémorisé, accord qui charge les 3 outils (interceptés), lien « Cookies » du pied de page, bandeau en arabe et accessibilité.

- Anti-spam : le serveur de test se lance avec `ORDER_LIMIT_PER_HOUR=1000` (les tests passent beaucoup de commandes depuis la même machine), et la commande `npx playwright test` aussi (le test de la limite lit la même valeur). `parcours.spec.ts` vérifie le champ piège, la limite par appareil et l'en-tête HSTS.

## Essais visuels
Photo libre de droits (scikit-image « astronaut », recadrée sur le visage) : portrait reconnaissable, 1 800–2 300 fils, ~0,7–0,9 km de fil, ~1 s de calcul + ~2 s de rendu.

## Banc qualité
`python bench/bench.py <dossier_photos> <dossier_sortie>` : rendu + score de ressemblance global et visage par photo. Résultats v0.1 → v0.2 dans `docs/algorithm.md`.

## À venir
Banc de 30 photos types (phase 1b), comparaison simulation / planche réelle (phase 1c).
