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

## Animation de l'accueil : portrait d'archive fourni par Zaki

- Portrait de démonstration régénéré par le moteur (variante standard, recadrage 55,170,850, 3 158 fils, 240 clous) à partir de la photo d'archive fournie ; médaillon, comparaison photo / fil, appel final et barre collante de l'accueil passent sur ce portrait (`martyr-photo.webp`, `martyr-fil.webp`). Crédit : « Photo d'archive ».
- Rendu plus net : un tracé par fil (les croisements s'assombrissent enfin comme sur la planche ; avant, un tracé groupé ne cumulait pas l'opacité), largeur d'un pixel physique, opacité calculée comme la simulation du moteur (+30 % pour compenser l'anticrénelage), rendu au moins en 2×.
- Test e2e : le nombre de fils est lu dans le JSON du portrait.
- Idées cadeaux, carte « Pour les grands-parents » : photo de fillette fournie par Zaki (`fillette-photo.webp`) et son portrait en fil calculé par le moteur (contraste, 3 065 fils, `fillette-fil.webp`), à la place du visuel provisoire.

- Accueil : carte « De la photo au fil » avec curseur rond (photo couleur ↔ fil, aller-retour d'invitation à la première apparition) sur le visage de la femme du couple ; carte cadeau « Pour un couple » avec la photo du couple.
- Accueil : carte cadeau « Pour ses parents » illustrée par le portrait de Salah Aougrout et son rendu en fil (moteur, variante standard, 2 583 lignes) ; visuel provisoire.
- Accueil : carte cadeau « Pour soi » avec la photo fournie par Zaki et son rendu en fil (variante standard, 1 782 lignes).
- Accueil : carte cadeau « En mémoire d'un proche » avec la photo d'archive de Larbi Ben M'hidi, recadrée sur le visage, et son rendu en fil (variante contraste, 2 947 lignes).
- Accueil : sous l'animation, le crédit « Photo d'archive » devient le nom du martyr, Ali La Pointe (fr, en, ar).
- Accueil : légende « La star algérienne : Salah Aougrout » sur la carte « Pour ses parents » (fr, en, ar).
- Album produit : 15 visuels (Ali La Pointe, dévidoir, puis chaque portrait en fil suivi de sa photo : Salah Aougrout, Larbi Ben M'hidi, homme en veste bleue, fillette, couple, chat) ; textes alternatifs fr/en/ar.
- Étapes sur téléphone : onglets sur deux rangées de trois, de même largeur, pour éviter que les libellés se chevauchent (vérifié aussi avec une grande taille de texte).
- Accueil et album : la carte « Pour soi » prend la photo de la femme en caftan ; rendu en fil net (photo légèrement contrastée et accentuée avant calcul, variante contraste, poids de ligne 0,18, 3 158 lignes).
- Accueil : l'animation de tissage montre désormais la femme en caftan (séquence du moteur, 3 158 lignes ; médaillon caftan-photo ; légende « Portrait d'exemple » fr/en/ar). Ali La Pointe reste en tête de l'album, en bas de page et dans la barre collante.
- Album : rendus en fil plus nets pour Salah Aougrout (2 768 lignes), le couple (3 179) et la fillette (2 930) : photo contrastée et accentuée, fond gardé, variante contraste, poids de ligne 0,18 ; 4 réglages comparés pour chacun.
- Album : portrait d'un bébé (rendu en fil : photo contrastée et accentuée, fond gardé, variante contraste, poids de ligne 0,18, 2 356 lignes ; 8 réglages comparés).
- Album : portrait d'une femme en haïk (rendu en fil : variante contraste, fond gardé, poids de ligne 0,18, 2 942 lignes ; 6 réglages comparés).
- Album : portrait d'un grand-père à la chéchia (rendu en fil : variante contraste, fond gardé, poids de ligne 0,18 ; 6 réglages comparés).
- Planche : nouveau composant BoardPlan (plan SVG 50 × 50 cm dessiné depuis la géométrie du moteur : 240 clous, secteurs A-D de 60, A1 à 9 h, sens horaire, A et C sur fond noir). Utilisé dans la carte « La planche et ses 240 clous » de l'accueil et en 2e image de l'album (planche-plan.webp). Test e2e : 240 clous, numérotation 1-60 par secteur. Le visuel Gemini envoyé n'est pas utilisé tel quel (numéros incohérents, C et D inversés par rapport à notre planche).
- Marque : « Studio Fil » devient « DeeKra » (décision D9 validée) dans le site, les titres, le pied de page, les maquettes d'écrans et la démo (fr, en, ar). Logo calligraphié « Deekra » dans l'en-tête (56 px de haut sur téléphone, 76 px sur ordinateur) et version claire dans le pied de page ; favicon, icône 512 et apple-touch-icon. Maquette du guide vocal corrigée : C en bas à droite, D en bas à gauche, comme la planche.
- Prix : prix de lancement provisoire 4 900 DA (config/catalog.ts, en attendant les coûts de fabrication), affiché « 4 900 DA » / « DZD 4,900 » / « 4 900 د.ج » avec la mention « Prix de lancement provisoire ». La commande en ligne reste fermée (orderingOpen = false) : bouton « Bientôt disponible » inactif. Nouveau formateur lib/price.ts (libellés de devise dans config/currencies.ts) et tests unitaires.
- Accueil : légende de l'animation « Beauté Algérienne » (fr, en, ar).
- Carte-message : carte cadeau « Pour une occasion » (pleine largeur, photo du bébé) et ligne « Carte-message offerte pour l'occasion de votre choix » dans « Inclus ». À prévoir au tunnel de commande : choix de l'occasion (naissance, anniversaire, mariage, souvenir, autre) pour glisser la bonne carte imprimée dans le pack.
