# Historique

## 2026-11-12
- **Relevé point par point de la référence** (`replica/recon.md`) et rattrapage : ligne de preuves du héros, en-tête de section scindé, cartes cadeaux cliquables avec œuvre superposée, encadré matériaux et puces, bandeau « l'offrir » complet, galerie produit en carrousel (défilement aimanté, flèches, vignettes), colonne d'achat collante avec accordéon, menu de langue déroulant, pied de page foncé à 5 colonnes, appel final en ligne. **Nouvelle page « Le kit »** (`/kit`) : achat, planche animée, avant/après + 3 exemples, « Comment ça marche » en 5 étapes, guide sur téléphone, « pour offrir », « pourquoi nous », FAQ. 50 tests navigateur.
- **Animations de la page d'accueil** : apparitions au défilement, bandeau qui défile, effets au survol ; désactivées avec « réduire les animations ». 2 tests navigateur ajoutés.
- **Système de design** : jetons mesurés sur la boutique de référence (`replica/design/`), génération de `tokens.css`, fiches composants, page interne `/design`, contrôle des contrastes (0 échec AA). Pied de page passé en blanc comme la référence.
- **Page d'accueil v2** : mise en page, couleurs et polices alignées sur la boutique de référence à la demande du propriétaire ; logo, textes et visuels propres (FR/EN/AR). Nouvelles sections : idées cadeaux, curseur photo/fil, « l'offrir », fiche produit avec galerie, barre d'achat mobile.
- **Plateforme, étape 1 (fondations)** : site Next.js 16 en FR/EN/AR (RTL), page d'accueil avec portrait tissé en direct depuis le moteur, base PostgreSQL (Prisma 7, migration initiale, données de référence sans prix), service moteur FastAPI protégé par jeton, Docker Compose, 13 tests unitaires et 34 tests navigateur (dont accessibilité axe).
- Décision D1 validée : commerce sur mesure.
- Cahier des charges v1.1 (code d'activation, guidage audio, clous pré-posés, numérotation A1–D60).
- Études : concurrentielle, analyse du modèle de référence, dossier `docs/reverse-engineering/`.
- **Moteur v0.2.0 (phase 1b)** : cadrage automatique sur le visage (YuNet), fond éclairci, pénalité des zones claires, contours renforcés, banc d'essai qualité (`bench/bench.py`), 36 tests.
- **Moteur v0.1.0 (prototype phase 1a)** : `services/engine/` — géométrie, prétraitement, glouton, rendu, JSON, CLI, 26 tests.

## Carrousel « Comment ça marche »

- Nouveau composant `StepsCarousel` : grande image qui change avec l'étape, rangée de 5 onglets à icônes fines (dessin maison), légende de l'étape active.
- Avance seul toutes les 5,5 s (la barre sous l'onglet actif sert de minuterie), pause au survol, au focus, hors écran ou par bouton ; glisser au doigt ; flèches du clavier ; sens inversé en arabe ; immobile avec « réduire les animations ».
- Placé sur l'accueil juste après le bandeau de confiance (ancre `#comment`) et sur la page du kit à la place de la grille. L'ancienne section « Dans la boîte » de l'accueil prend l'ancre `#contenu`.
- Démo HTML : le carrousel fonctionne aussi hors ligne.
- Tests : 2 nouveaux tests e2e (onglets, clavier, défilement auto, pause ; mouvement réduit).
- Photos fournies par Zaki (générées par IA) pour les étapes 1, 4 et 5 : `public/visuels/etapes/` (ouvrir, preparer, accrocher), recadrées en carré 1000 px. Marquage du couvercle de la boîte et gravure du support de téléphone (ressemblant à une marque tierce) effacés par flou local.
- Étape « Préparez le kit » ajoutée (6 étapes) avec la photo des mains qui assemblent. Étapes code, photo et guide vocal : maquettes d'écrans maison par langue (`scripts/make-step-mockups.cjs`, sortie `public/visuels/etapes/{code,photo,voice}-{fr,en,ar}.webp`). Aucune image Let's String utilisée.
- Étape « Entrez votre code » en français : photo fournie par Zaki (`code-photo-fr.webp`) ; maquette conservée en anglais et en arabe car l'écran de la photo est en français.
- Galerie produit : photo du dévidoir en bois (fournie par Zaki) en 2e position (7 visuels). Photo « Suivez la voix » reçue mais non utilisée : écran et logo d'une marque tierce, image trop proche de la leur.
- Étape « Suivez la voix » : photo fournie par Zaki avec notre propre écran incrusté sur le téléphone, une version par langue (`voice-photo-{fr,en,ar}.webp`, `scripts/incruste-ecran-voix.py`). L'écran et le logo d'origine ne sont plus visibles.

## Accueil réorganisé dans l'ordre de la boutique de référence

Ordre : héros, bandeau de confiance, « Qu'est-ce que {marque} ? » (cadeau / loisir + photo), carrousel « Comment ça marche », « De la photo au fil » (avant/après), « Que contient le kit ? » (6 éléments : boîte-support, planche 240 clous, fil et dévidoir, support de téléphone, code, guide vocal), « Comment fonctionne notre générateur en ligne ? » (écrans qui défilent), fiche produit, idées cadeaux, FAQ, appel final.
Retirés de l'accueil : l'ancien bloc « Dans la boîte » (étapes + encadré, remplacé par la grille) et « L'offrir » (déjà sur la page du kit). Non repris : avis clients, vidéos clients, offre 2 kits (aucun contenu réel).
Nouveaux textes sous `home.*` (fr, en, ar).
