# Analyse fonctionnelle du modèle de référence (Let's String)

_Analyse du 2026-11-12. Elle s'appuie sur le site public et sur l'application publique letsstring.art, observée dans un navigateur : écrans, routes, paramètres visibles dans le code client. Aucun code n'est repris. Seul le fonctionnement est décrit, pour concevoir notre propre implémentation._

## 1. Paramètres techniques confirmés

| Paramètre | Valeur observée | Source |
|---|---|---|
| Nombre de clous | **240** | `pegsCount: 240` / `points: 240` |
| Nombre de lignes | **3 500** (3 499 segments) | `steps: 3500`, `nbLines: 3499` |
| Disposition | **Cercle** (forme « ellipse ») ; la forme rectangle existe dans le code mais n'est pas utilisée | `shape: ELLIPSIS` |
| Mode | **Monochrome** ; un mode couleur existe dans le code mais n'est pas utilisé | `mode: MONOCHROME` |
| Aperçu | Canevas de 500 × 500 px, opacité du fil 0,5, épaisseur 1 px, clous affichés | paramètres de l'aperçu |
| Génération serveur | Paramètres `points`, `steps`, `seed: 30`, `width: 2`, `weight: 10` ; sortie `steps, points, coords, imgUrl` | requête de génération |
| Planche | MDF 50 × 50 cm, clous déjà posés | fiche produit |
| Fil | Noir, un seul fil continu | fiche produit |

**Conclusion :** notre hypothèse (240 clous en cercle, monochrome, environ 3 500 lignes) correspond exactement à leur produit. La graine fixe (`seed`) confirme qu'ils rendent la génération reproductible.

## 2. Architecture observée

- **Frontend :** application React monopage (Material UI), multilingue.
- **Langues :** au moins EN, IT, PL, FR.
- **API :** REST versionnée (`/v1/`), hébergée chez DigitalOcean (Francfort) avec un CDN pour les médias.
- **Points d'entrée de l'API :**
  - `art/verify` : vérification du code d'activation.
  - `art/start`, `art/create`, `art/generate` : création et génération.
  - `art/save` : validation du portrait choisi.
  - `art/send` : envoi par email.
  - `art/pdf/download` : téléchargement du PDF.
  - `admin/auth`, `admin/coupons` : back-office minimal, gestion des codes.
- **Génération en deux temps :**
  1. **Aperçu calculé dans le navigateur** du client. Plusieurs variantes sont dessinées progressivement sur un canevas, avec une qualité, une opacité et une épaisseur différentes. Cela ne coûte rien côté serveur et s'affiche immédiatement.
  2. **Génération définitive sur le serveur** pour la variante choisie. Elle produit la séquence officielle, les coordonnées des clous et l'image finale.
- **Guidage vocal :** des **fichiers MP3 pré-enregistrés, un par numéro et par langue** (`assets/app/{langue}/{numéro}.mp3`). Des pistes d'introduction et des mélodies de fond sont jouées séparément. Pas de synthèse vocale.
- **Remarque :** les noms de paramètres de leur aperçu (`pegsCount`, `quality`, `lineOpacity`, `displayPegs`, `invertColors`, `ELLIPSIS`) ressemblent à ceux d'un générateur open source connu. **À vérifier**, cela ne nous concerne pas puisque nous développons notre propre moteur.

## 3. Parcours client reconstitué

| Route | Écran | Rôle |
|---|---|---|
| `/` | Accueil | « Télécharger une photo » ou « Choisir un modèle » |
| `/verify` | Code | Saisie du code d'activation du kit |
| `/create-art` | Studio | Import, recadrage, choix parmi plusieurs variantes générées dans le navigateur |
| `/designs` | Galerie | Modèles prêts à l'emploi (célébrités, animaux, mandalas, cœurs…) |
| `/create-ready-art/:imageId` | Studio | Génération à partir d'un modèle de la galerie |
| `/assembly/:sessionId` | Assistant | Montage pas à pas : voix, musique, vitesse, pause et reprise, langue |
| `/admin/*` | Back-office | Connexion et gestion des codes ou coupons |

Points notables :
- Une **galerie de modèles prêts** permet de créer sans photo personnelle, pour un cadeau ou quand on n'a pas de bonne photo.
- La **session de montage** est identifiée par un lien unique, `/assembly/:sessionId`. On reprend sur n'importe quel appareil sans créer de compte.
- **Il n'y a pas de comptes clients**, seulement code et session. Le parcours est très léger.

## 4. Ce que nous reproduisons (sous notre marque)

1. 240 clous en cercle sur une planche carrée de 50 × 50 cm, clous pré-posés, fil noir unique, environ 3 500 lignes. **Les valeurs restent paramétrables.**
2. L'aperçu rapide côté client, puis la génération définitive côté serveur avec une graine fixe pour la reproductibilité.
3. Plusieurs variantes proposées pour chaque photo.
4. Le code d'activation et un lien de session de montage, sans compte obligatoire.
5. Le guidage vocal par fichiers audio pré-enregistrés (nombres de 1 à 240 × FR, EN, AR), avec musique, vitesse, pause et reprise.
6. Une galerie de modèles prêts. **Ce sont nos propres modèles** : pas de célébrités sans droits ni d'images reprises.
7. Le PDF téléchargeable et l'envoi par email.

## 5. Ce que nous faisons mieux ou différemment

- **Repères A1 à D60** au lieu de 1 à 240, plus faciles à retrouver physiquement. Il faudra choisir aussi le format des annonces audio (« B 17 » ou « 77 »).
- **Arabe et RTL**, et un **marché algérien** avec paiement à la livraison et transporteurs locaux.
- La vente en ligne « créer puis acheter », en plus du code d'activation.
- Un contrôle de la qualité de la photo et du rendu trop sombre, défaut signalé chez des concurrents.

## 6. Limites de cette analyse

- Le générateur et l'assistant n'ont pas été utilisés de bout en bout, faute de code d'activation.
- La numérotation exacte sur la planche physique (1 à 240 ou secteurs) n'a pas pu être confirmée.
- Un kit acheté permettrait de valider le PDF, le marquage des clous et le diamètre du fil.
