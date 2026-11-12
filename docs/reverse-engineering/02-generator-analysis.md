# 02 — Analyse fonctionnelle du générateur (letsstring.art)

_Exploration du 2026-11-12 dans un navigateur réel. Méthode : navigation dans les écrans accessibles sans code, observation des requêtes réseau, et lecture des textes, routes et paramètres présents dans le JavaScript public servi au navigateur. **Aucune protection n'a été contournée** : aucun code d'activation n'a été deviné ou testé, aucun appel API authentifié n'a été effectué._

**Légende :**
- ✅ Observé et testé
- 🔍 Lu dans le code public (fait, non exécuté)
- 📄 Documentation ou FAQ
- 💭 Hypothèse
- ❓ Non vérifiable

**Limite majeure :** sans code d'activation, les écrans après la saisie du code (import, recadrage, génération, assistant) **n'ont pas pu être utilisés**. Ils sont décrits à partir du code public et de la FAQ.

## A. Accès et activation

| Question | Réponse | Statut |
|---|---|---|
| Format du code | **8 caractères alphanumériques latins**, affichés `XXXX-XXXX` | 🔍 regex `^\S{4}-\S{4}$`, champ qui insère le tiret et met en majuscules |
| Où trouver le code | Carte dans le kit, avec un QR code vers letsstring.art | 📄 FAQ |
| Vérification | Appel `POST art/verify`, puis passage à l'étape suivante | 🔍 |
| Expiration | Le code n'expire jamais | 📄 |
| Règles d'usage | Les instructions peuvent être **envoyées par email au maximum 3 fois**, après quoi **le code devient inactif** | 🔍 texte `attentionText` |
| Codes supplémentaires | Vendus 25 € sur la boutique | ✅ |
| Lien code ↔ projet | Le code ouvre une session de création. Le portrait sauvegardé donne un `sessionId` utilisé pour l'assistant (`/assembly/:sessionId`) | 🔍 routes ; 💭 modèle de données |
| Back-office des codes | Écrans `admin/coupons`, `admin/coupons/:code`, **génération par lots** `admin/coupons/generate/:n` | 🔍 |
| Côté serveur | L'URL directe `/verify` renvoie un document **OData** (`CouponListItemDto`) | ✅ ; 💭 backend .NET / ASP.NET OData |

## B. Import et préparation de l'image

| Élément | Constat | Statut |
|---|---|---|
| Formats | `accept="image/*"` : tous les formats d'image du navigateur | 🔍 |
| Taille max | **15 Mo** | 🔍 texte de l'écran d'import |
| Recadrage | Écran « Veuillez ajuster l'image », recadrage carré ou circulaire | 🔍 ; 💭 forme exacte |
| Luminosité / contraste | **Aucun réglage manuel trouvé** dans le code | 🔍 (absence) |
| Niveaux de gris | Mode `MONOCHROME`, conversion dans le moteur | 🔍 |
| Inverser les couleurs | Paramètre `invertColors: false` (lié au choix planche blanche ou noire) | 🔍 |
| Choix de la planche | Écran « Choisissez votre planche » : **blanche ou noire**, choix lié au pays (Pologne / autres pays) | 🔍 textes `chooseBoardTitle`, `whiteBoard`, `blackBoard` |
| Galerie de modèles | `/designs` : environ 24 modèles (célébrités, œil, mandalas, animaux, maison, cœur), **visibles sans code** | ✅ (capture `captures/app-galerie-modeles.jpg`) |
| Changer d'image | « Vous pouvez essayer une autre image si le résultat ne vous plaît pas » | 🔍 |

## C. Génération algorithmique

### C.1 Paramètres confirmés (code public)

```
Aperçu navigateur : pegsCount 240, nbLines 3499, mode MONOCHROME, shape ELLIPSIS,
                    canvas 500×500, lineOpacity ~0.5, lineThickness ~1, blur 0,
                    displayPegs true, invertColors false, quality = variable
Génération serveur : points 240, steps 3500, seed 30, width 2, weight 10,
                     index = numéro de variante ; retour : steps, points, coords, imgUrl
```

### C.2 Fonctionnement déduit

1. **Clous** : 240 positions régulières sur une ellipse (un cercle quand la zone est carrée). 🔍 Le code contient aussi une option rectangle, non utilisée. 🔍
2. **Numérotation** : de 1 à 240 (ou de 0 à 239) dans l'application. **Aucun système de secteurs A, B, C, D n'a été trouvé.** 🔍 (absence) Le marquage physique est connu grâce au porteur de projet 📄 : **4 zones A, B, C, D de 60 clous, fond alterné noir / blanc / noir / blanc**, instructions de la forme « A1 → D56 ». L'application convertit donc l'index interne (0 à 239) en repère de zone.
3. **Variantes** : plusieurs aperçus s'affichent en grille, avec une sélection et un rendu progressif (dessin animé, intervalle de 2 à 6 ms). Les variantes diffèrent par le paramètre `quality` et par l'opacité ou l'épaisseur. 🔍
4. **Génération définitive** : côté serveur, avec une **graine fixe (`seed: 30`)**, ce qui la rend reproductible. L'écran indique « La génération peut prendre **5 à 10 minutes** ». 🔍
5. **Algorithme** : les noms de paramètres de l'aperçu (`pegsCount`, `quality`, `lineOpacity`, `displayPegs`, `invertColors`, `ELLIPSIS`, `lowerNbSegmentsForThread`) **correspondent à ceux d'un projet open source publié sous licence GPL-3.0** (piellardj, *image-stylization-threading*). 💭 À confirmer, et sans conséquence pour nous puisque nous développerons notre propre moteur.
6. **Méthode probable** : algorithme glouton. Depuis le clou courant, on choisit le segment qui assombrit le mieux les zones encore trop claires, on soustrait sa contribution, puis on recommence 3 500 fois. 💭 (cohérent avec les paramètres et l'état de l'art, voir `04-algorithm-study.md`)
7. **Longueur de fil** : non affichée dans l'application. 🔍 (absence) Estimation : environ 1 km par portrait (voir 04). 💭
8. **Instructions** : séquence `steps` de 3 500 numéros de clous, plus `coords` pour l'affichage, plus un PDF (`art/pdf/download`) et un envoi par email (`art/send`). 🔍 Le contenu exact du PDF reste ❓.

### C.3 Points d'entrée API observés (noms uniquement)

`art/verify`, `art/start`, `art/create`, `art/generate`, `art/save`, `art/resume/:id`, `art/send`, `art/pdf/download`, `admin/auth`, `admin/coupons`, `admin/coupons/generate/:n`. Base : `https://www.letsstring.art/v1/`. 🔍 Les formats de requête et de réponse en détail restent ❓ (non appelés).

## D. Interface de réalisation (assistant)

| Fonction | Constat | Statut |
|---|---|---|
| Accès | `/assembly/:sessionId?lang=xx`, lien reçu par email | 🔍 |
| Visualisation | Tableau avec clous affichés ; on peut **toucher un clou à l'écran** pour s'y rendre | 📄 FAQ 4 |
| Étape courante / prochain clou | Annonce vocale du numéro du prochain clou | 📄 ; 🔍 |
| Voix | **Fichiers MP3 pré-enregistrés** : `assets/app/{langue}/{numéro}.mp3`, plus des pistes d'introduction `assets/app/intro/*.mp3` | 🔍 |
| Musique | Ocean, Rain, Nature, Winter Fire, Meditation 1/2/3, ou aucune ; volume par défaut 0,3, en boucle | 🔍 |
| Vitesse | 0,5× à 5×, ce qui correspond à une **pause de 5 500 ms à 0 ms** entre deux annonces (1× = 1 000 ms) | 🔍 |
| Pause / reprise | Oui | 📄 |
| Reprise après interruption | Champ « Entrez l'étape où vous vous êtes arrêté », appel `art/resume/:id` | 🔍 |
| Bouton « Je suis perdu » | Présent | 🔍 (comportement exact ❓) |
| Progression | Barre de progression, étape courante et étapes restantes | 📄 FAQ 5 |
| Sauvegarde | `art/save`, sauvegarde de l'étape côté serveur | 🔍 ; 💭 fréquence |
| Recherche d'un clou | Saisie d'un numéro d'étape ou toucher d'un clou ; **pas de recherche par numéro de clou** trouvée | 🔍 / ❓ |
| Mobile | Mise en page responsive (breakpoints Material UI) | 🔍 ; ❓ (non testé en réel) |

**Cadence :** 6 h pour 3 500 étapes, soit environ 6 s par fil. C'est cohérent avec la vitesse 1× : environ 1,5 s de voix, 1 s de pause et le geste. 💭

## E. Analyse technique

| Élément | Constat | Statut |
|---|---|---|
| Frontend | **React** (Create React App : `static/js/main.*.chunk.js`), Material UI, Redux, Axios, Yup (validation), React Router | 🔍 |
| Langues de l'application | EN, IT, ES, PL, DE, FR, CZ ; textes dans le bundle ; langue mémorisée dans `localStorage.lang` | 🔍 |
| Polices | Poppins, Rosarivo | ✅ |
| Backend | API REST versionnée `/v1/`. Indices **OData**, donc probablement **ASP.NET Core** | ✅ / 💭 |
| Stockage des médias | **DigitalOcean Spaces** (Francfort) et CDN : voix, musiques, images de modèles | 🔍 |
| Persistance client | Seulement la langue en `localStorage` ; la progression est côté serveur | 🔍 |
| Génération | Aperçu calculé **dans le navigateur** (canvas), version définitive **calculée sur le serveur** (5 à 10 minutes) | 🔍 |
| Analytics | Non observé sur l'application (présent sur la boutique) | ✅ |

## F. Ce qui reste à vérifier avec un vrai code

Voir `08-open-questions.md` : le parcours complet, le recadrage, le nombre de variantes, le PDF, la numérotation physique, le comportement de « Je suis perdu », la règle exacte des 3 envois, et le partage du code entre plusieurs portraits.
