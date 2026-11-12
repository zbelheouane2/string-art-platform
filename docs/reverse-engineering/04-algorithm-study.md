# 04 — Étude mathématique et technique du moteur String Art

_Objectif : comprendre le problème et concevoir **notre propre** implémentation. Aucun code tiers n'est repris._

## 1. Formulation du problème

On dispose de :
- une image cible `T(p) ∈ [0,1]`, la « noirceur » souhaitée au pixel `p` (0 = blanc, 1 = noir) ;
- `N` clous de positions fixes `P_0 … P_{N-1}` ;
- un fil **continu** : la solution est une suite de clous `s_0, s_1, …, s_K`. Chaque paire consécutive forme un segment `L_k = [P_{s_k}, P_{s_{k+1}}]`.

Le rendu simulé, avec un fil d'opacité `α` (part d'un pixel couverte par le fil) et des fils superposés qui s'accumulent de façon multiplicative :

```
R(p) = 1 − ∏_k (1 − α · c_k(p))      c_k(p) = couverture du pixel p par le segment k (0..1)
```

Objectif : minimiser l'écart perçu entre `R` et `T`, sous contraintes (fil continu, K ≤ K_max, pas de segment entre clous voisins, longueur de fil limitée) :

```
min_s  Σ_p  w(p) · ( G*T(p) − G*R(p) )²  +  λ · Longueur(s)
```

- `G*` est un flou gaussien qui simule la perception à distance : on regarde un tableau de 50 cm à 1 ou 2 m.
- `w(p)` est une carte d'importance : visage, yeux et contours pèsent davantage.

Le problème est combinatoire, du type voyageur de commerce. On le résout de façon **approchée, gloutonne**. C'est l'approche de fait du marché (voir `02`, §C).

## 2. Chaîne de traitement

### 2.1 Prétraitement de l'image
1. **Correction de l'orientation EXIF** et décodage (JPG, PNG, WebP, HEIC à convertir).
2. **Recadrage** carré, puis **masque circulaire**.
3. **Niveaux de gris** par luminance perceptuelle : `Y = 0,2126 R + 0,7152 G + 0,0722 B` (Rec. 709).
4. **Redimensionnement** à la résolution de travail (par exemple 600 × 600 px, soit environ 0,8 mm par pixel pour un cercle de 47 cm).
5. **Normalisation** : étirement de l'histogramme entre les percentiles 1 et 99.
6. **Rehaussement du contraste** : CLAHE (égalisation adaptative locale) et correction gamma. Ce sont les deux réglages exposés au client sous forme de variantes.
7. **Option fond** : atténuer ou éclaircir l'arrière-plan. Le sujet est détecté par la détection de visage ou une segmentation simple.
8. **Inversion** pour une planche noire avec fil blanc : `T = 1 − Y`.
9. **Carte d'importance `w`** : à partir de la détection de visage (OpenCV) et de la magnitude des contours (Sobel).

### 2.2 Géométrie des clous (cercle)

```
θ_i = θ_0 + 2π·i/N          x_i = c_x + r·cos θ_i         y_i = c_y + r·sin θ_i
```

- N = 240. Pour une planche de 50 cm, un cercle de diamètre D ≈ 470 mm donne un **pas de π·D/N ≈ 6,2 mm** entre clous.
- **Repère humain** : `secteur = "ABCD"[i div 60]`, `numéro = (i mod 60) + 1`. Ainsi l'index 0 donne A1, 59 donne A60, 60 donne B1 et 239 donne D60.
- Les coordonnées sont stockées **en millimètres** (source de vérité unique pour le rendu, le PDF et le gabarit de fabrication). Les pixels en sont dérivés.
- **Raffinement physique** : le fil passe *autour* du clou (diamètre d ≈ 1,5 mm), pas par son centre. Un modèle plus fin utilise la tangente au clou, côté gauche ou droit. Ce point est à valider sur le prototype.

### 2.3 Pré-calcul des segments
- Toutes les paires : N·(N−1)/2 = **28 680 segments**.
- Rastérisation **anti-crénelée** (algorithme de Xiaolin Wu, ou échantillonnage le long du segment) : liste `(indices de pixels, couvertures)`.
- Mémoire : environ 28 680 × 400 px en moyenne, soit environ 11 M entrées (int32 et float16), autour de 70 Mo. Ce cache est **calculé une seule fois** pour la géométrie standard et réutilisé.

### 2.4 Sélection gloutonne

```
E ← w ⊙ T                         # « noirceur restante à couvrir »
a ← clou de départ (par ex. le plus sombre au bord, ou fixe = A1)
pour k = 1 … K :
    pour chaque b admissible :           # |a−b| ≥ gap_min, (a,b) non déjà utilisé, b ∉ derniers clous
        score(b) = Σ_{p∈L(a,b)} c(p)·E(p)  /  |L(a,b)|^β       # contribution moyenne (β≈1) ou totale (β=0)
    b* ← argmax score
    si score(b*) < seuil : arrêt anticipé
    E(p) ← E(p) − α·c(p)·poids        sur L(a,b*)              # « on retire l'encre posée »
    séquence.append(b*) ; a ← b*
```

- **Score (contribution de la ligne)** : il favorise les lignes qui traversent beaucoup de pixels encore trop clairs par rapport à la cible. La normalisation par la longueur évite de privilégier les diamètres.
- **Accumulation de la noirceur** : `E` diminue à chaque passage. On peut le borner à des valeurs négatives modérées pour pénaliser la sur-couverture.
- **Contrôle des répétitions** : interdire une même paire deux fois, imposer un écart minimal entre clous (`gap_min` d'environ 10 à 20 clous) pour éviter les fils collés au bord, et une liste tabou des derniers clous visités.
- **Vectorisation** : pour un clou `a`, les 239 scores se calculent en une opération NumPy sur le cache. Coût : 3 500 × 239 × 400 ≈ 335 M multiplications-additions, soit **quelques secondes en NumPy/Numba**. Ces 5 à 10 minutes chez Let's String viennent probablement de leur file d'attente ou de raffinements 💭.

### 2.5 Améliorations au-delà du glouton simple
1. **Multi-variantes** : plusieurs combinaisons (gamma, CLAHE, α, carte d'importance) donnent 3 à 5 propositions, notées puis présentées au client.
2. **Anticipation** (lookahead ou beam search) sur 2 ou 3 coups pour éviter les impasses.
3. **Raffinement itératif** : après le glouton, on remplace des fragments de séquence par une recherche locale (recuit simulé), en gardant la continuité du fil.
4. **Multi-résolution** : glouton rapide à basse résolution, puis affinage.
5. **Approches globales** (moindres carrés ou programmation linéaire sur l'ensemble des segments, puis chaînage) : meilleure qualité, mais plus coûteuses. Utiles en recherche et développement.

### 2.6 Simulation réaliste (aperçu client)
- Rendu en **sur-échantillonnage** (par exemple 2 000 × 2 000 px) avec l'épaisseur réelle du fil (environ 0,3 à 0,5 mm), l'opacité et l'accumulation multiplicative, puis réduction.
- Texture de planche (blanche ou noire) et rendu des clous.
- **Calibrage** : comparer une photo du tableau physique réel au rendu simulé, puis ajuster `α` et l'épaisseur. C'est indispensable (voir `08`).

### 2.7 Évaluation de la qualité
Plusieurs métriques sont nécessaires, car aucune ne suffit seule :
- **MSE / PSNR** sur les images floutées (perception à distance) ;
- **SSIM** (similarité structurelle) ;
- erreur pondérée sur le **visage** ;
- **histogramme** : détecter un rendu trop sombre ou trop clair (défaut signalé chez les concurrents) ;
- indicateurs de faisabilité : longueur de fil, segments très courts, densité au centre.

### 2.8 Longueur de fil

Corde entre les clous i et j : `ℓ(i,j) = D · sin(π·|i−j| / N)`.

```
L_totale = Σ_k ℓ(s_k, s_{k+1})  +  K · π·d_clou/2  +  marge (amorce, nœuds, chutes)
```

Ordre de grandeur pour D = 470 mm et K = 3 500 : une corde moyenne de 0,25 à 0,35 m donne **environ 0,9 à 1,2 km de fil par portrait** 💭. C'est cohérent avec « une bobine = 3 tableaux » 📄. À mesurer sur le prototype.

### 2.9 Production des instructions
- La séquence `s` est la **seule source de vérité**. Le rendu, le PDF, l'assistant et la longueur de fil en dérivent.
- Format : `[{étape, de: "A12", vers: "C47", index_de, index_vers}]`, plus métadonnées (version du moteur, graine, paramètres, empreinte de l'image).
- Le PDF contient la séquence paginée en gros caractères, cochable, avec des repères de secteur. L'assistant utilise la même séquence.

## 3. Reproductibilité
Moteur **déterministe**. À entrée identique (image normalisée, paramètres, version du moteur, graine), la sortie est identique. On enregistre l'empreinte SHA-256 de l'image prétraitée et la version du moteur. Une nouvelle version ne modifie jamais un portrait validé.

## 4. Solutions open source et licences

| Projet | Licence | Intérêt | Utilisation possible |
|---|---|---|---|
| halfmonty/StringArtGenerator (JS, ★586) | **MIT** | Générateur glouton pédagogique | Inspiration ; réutilisation possible en citant la licence |
| piellardj/image-stylization-threading (★119) | **GPL-3.0** | Moteur web proche de ce qu'utiliserait Let's String 💭 | **Ne pas intégrer** : copyleft, qui obligerait à publier notre code. Lecture seulement |
| danielvarga/string-art (Python, ★136) | Aucune licence | Approche par programmation linéaire | Lecture seulement (tous droits réservés) |
| kaspar98/StringArt (★91) | Aucune licence | Glouton Python documenté | Lecture seulement |
| birsakm/StringArt (MATLAB, ★65) | Aucune licence | Code de l'article académique Birsak et al. | Lecture seulement |
| Article « String Art: Towards Computational Fabrication of String Images » (RWTH Aachen, Eurographics 2018) | Publication | Modèle d'optimisation de référence | Base théorique |
| Bridges 2022 (archive bridgesmathart.org) | Publication | Variantes et esthétique | Base théorique |

**Bibliothèques recommandées (licences permissives)** :
- NumPy (BSD) ;
- OpenCV (Apache 2.0) : CLAHE, détection de visage, flous ;
- Pillow (HPND) : décodage ;
- scikit-image (BSD) : SSIM ;
- Numba (BSD) : accélération ;
- FastAPI (MIT) ;
- ReportLab (BSD) : PDF ;
- pillow-heif (BSD) : photos iPhone HEIC.

**Règle :** aucun code tiers n'est copié. Les dépendances sont limitées à des bibliothèques génériques à licence permissive.

## 5. Découpage en modules (détaillé dans `05`)

1. `imaging` : prétraitement.
2. `geometry` : clous, repères, millimètres et pixels.
3. `solver` : glouton et raffinements.
4. `render` : simulation réaliste.
5. `instructions` : séquence, PDF, longueur de fil.
6. `guide` : données de l'assistant (côté application).
