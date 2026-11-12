# REVERSE ENGINEERING — Synthèse de référence

_Mission du 2026-11-12. Document de référence pour la suite du projet. Les détails et les sources se trouvent dans les fichiers 01 à 08._

## 0. Méthode et outils

| Outil | Utilisation | Résultat |
|---|---|---|
| Navigateur réel (navigateur intégré de l'application Claude, sur l'ordinateur du porteur de projet) | Navigation, captures, JavaScript de lecture, requêtes réseau | ✅ utilisé |
| Playwright dans le conteneur cloud | Bloqué : le proxy réseau refuse letsstring.art et letsstring.store | ❌, remplacé par le navigateur intégré |
| Endpoints publics Shopify (`/products.json`) | Catalogue et prix | ✅ |
| Recherche web | Avis, concurrents, open source, Algérie | ✅ |

**Légende des statuts :**
- ✅ Observé et testé
- 🔍 Lu dans le code public (non exécuté)
- 📄 Documentation publique
- 💭 Hypothèse
- ❓ Non vérifiable

**Limite majeure :** sans code d'activation, l'intérieur du générateur (import, recadrage, génération, assistant) n'a pas été utilisé. Il est décrit à partir du code public et de la FAQ. Aucune protection n'a été contournée.

Captures dans `captures/` : accueil de la boutique (desktop et mobile), accueil de l'application, saisie du code, galerie de modèles.

## 1. Ce qu'est Let's String, en une phrase

Un **kit générique** à 119 € (planche MDF de 50 × 50 cm, 240 clous pré-posés en cercle, fil noir) vendu sur **Shopify**, personnalisé après l'achat grâce à un **code `XXXX-XXXX`** sur une **application React séparée**. Celle-ci génère une séquence de **3 500 fils**, puis guide la réalisation (environ 6 h) avec une **voix pré-enregistrée** et de la musique.

## 2. Faits clés confirmés

| Sujet | Valeur | Statut |
|---|---|---|
| Clous | **240**, en cercle (ellipse dans un carré) | 🔍 |
| Lignes | **3 500** | 🔍 📄 |
| Mode | Monochrome (le mode couleur existe dans le code, non utilisé) | 🔍 |
| Reproductibilité | Graine fixe (`seed: 30`) | 🔍 |
| Aperçu | Calculé dans le navigateur, plusieurs variantes | 🔍 |
| Génération définitive | Serveur, « 5 à 10 minutes » | 🔍 |
| Code | 8 caractères, `XXXX-XXXX`, n'expire pas ; 3 envois d'email maximum puis inactif | 🔍 📄 |
| Import | `image/*`, 15 Mo maximum | 🔍 |
| Planche | Blanche ou noire selon le pays | 🔍 |
| Voix | MP3 par numéro et par langue (7 langues) | 🔍 |
| Vitesse | 0,5× à 5× (pause de 5,5 s à 0 s) | 🔍 |
| Musiques | 7 ambiances | 🔍 |
| Reprise | Saisie de l'étape ou toucher du clou | 📄 🔍 |
| Stack de l'application | React, Material UI, Redux, Axios ; API `/v1/` (indices ASP.NET OData) ; DigitalOcean Spaces | 🔍 💭 |
| Boutique | Shopify, DM Sans et DM Serif, Klaviyo, Clarity, Meta | ✅ |
| Prix | Kit 119 € ; 2 kits 214,20 € ; code supplémentaire 25 € ; œuvre finie 439 € | ✅ |

## 3. Ce que nous devons reproduire fonctionnellement
1. Le kit générique avec code d'activation et QR code.
2. Le format 50 × 50 cm avec 240 clous pré-posés en cercle et environ 3 500 fils.
3. Les variantes de rendu proposées pour chaque photo.
4. Une génération reproductible (graine, version du moteur).
5. L'assistant vocal avec musique, vitesse, pause et reprise.
6. Le PDF d'instructions.
7. La galerie de modèles prêts.
8. Le code supplémentaire en vente.
9. La page produit unique orientée cadeau.

## 4. Ce que nous pouvons améliorer
- **Marché algérien** : paiement à la livraison avec confirmation WhatsApp, CIB/EDAHABIA, transporteurs locaux, **arabe et RTL**.
- **Numérotation A1 à D60** et voix composée (64 fichiers par langue).
- **Contrôle automatique de la photo**, recadrage centré sur le visage, détection du rendu trop sombre.
- **Génération rapide en arrière-plan**, avec notification.
- **Codes plus sûrs et plus clairs** : alphabet sans ambiguïté, clé de contrôle, PDF retéléchargeable, pas de code « brûlé ».
- **Sauvegarde automatique** de l'étape, reprise multi-appareil, mode hors connexion, écran allumé, « je suis perdu » visuel.
- Affichage de la longueur de fil et du temps restant.
- Matériel : porte-bobine anti-emmêlement, notice de chevalet claire, planche réutilisable.

## 5. Comment concevoir notre algorithme (résumé de `04`)
1. Prétraitement : EXIF, recadrage circulaire, luminance, normalisation, CLAHE et gamma, carte d'importance du visage.
2. Géométrie en **millimètres** à partir d'un gabarit versionné, 240 clous, repères A1 à D60.
3. Cache des 28 680 segments anti-crénelés.
4. **Glouton vectorisé** : à chaque pas, choisir le segment qui couvre le mieux la noirceur restante (pondérée), la soustraire, et contrôler les répétitions. Quelques secondes en NumPy/Numba.
5. Raffinements : variantes, anticipation, recherche locale.
6. Simulation réaliste calibrée sur une **vraie planche**, et métriques combinées (SSIM, MSE flouté, histogramme).
7. Sorties : séquence (source de vérité unique), PDF, JSON de l'assistant, longueur de fil.
8. Open source : lecture seulement. Pas de code GPL ni sans licence. Bibliothèques permissives uniquement (NumPy, OpenCV, scikit-image, FastAPI, ReportLab).

## 6. Comment gérer les codes uniques (résumé de `05` §5)
Génération par lots en Crockford Base32 (8 caractères + clé de contrôle), stockage haché, statuts, quotas, anti-force brute, export pour l'imprimeur, traçabilité.

## 7. Architecture recommandée (résumé de `05`)
- **Next.js / TypeScript** (boutique, activation, studio, assistant PWA, back-office ; FR/EN/AR RTL).
- **PostgreSQL**, stockage S3 privé.
- **Moteur Python / FastAPI** en modules (`imaging`, `geometry`, `solver`, `render`, `instructions`) avec une file de tâches.
- Adaptateurs de paiement et de livraison par marché.
- **Commerce sur mesure recommandé** plutôt que Shopify, à cause de l'Algérie.

## 8. Plan (résumé de `07`)
0 Cadrage → **1a Prototype du moteur → 1c Planche physique → 1b Qualité** → 2 Instructions et voix → 3 Générateur web → 4 Assistant → 5 Codes et back-office → 6 Boutique → 7 Internationalisation → 8 Lancement.
**Chemin critique :** moteur et planche physique.

## 9. Décisions attendues (voir `08`)
- D1 : commerce sur mesure ou Shopify.
- D2 : numérotation A1 à D60.
- D3 : règle d'usage d'un code.
- D4 : planche noire.
- D5 : galerie de modèles.
- D6 : langues de la voix.
- D7 : durée de conservation des photos.
- D8 : fabrication de la planche.
- D9 : nom de marque.

**Action recommandée :** acheter un kit Let's String pour lever les points non vérifiés et disposer d'une référence physique.
