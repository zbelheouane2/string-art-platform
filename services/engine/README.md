# Moteur String Art — prototype (phases 1a–1b)

Transforme une photo en **séquence de fils** reproductible pour la planche standard
(50 × 50 cm, 240 clous en cercle, secteurs A–D de 1 à 60, sens horaire, A1 à 9 h).

## Installation

```bash
cd services/engine
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
```

## Utilisation

```bash
python -m stringart photo.jpg --out sortie/                 # variante « standard »
python -m stringart photo.jpg --out sortie/ --variants      # doux / standard / contraste
python -m stringart photo.jpg --out sortie/ --crop 110,0,260 # recadrage manuel x,y,côté (px)
python -m stringart photo.jpg --out sortie/ --no-auto-crop   # recadrage centré (sans cadrage visage)
python -m stringart photo.jpg --out sortie/ --background keep # garder le fond tel quel
```

Sorties : `<nom>-<variante>.png` (simulation) et `<nom>-<variante>.json`
(séquence, étapes « A1 → C47 », longueur de fil, paramètres, version du moteur,
empreinte SHA-256 de la photo, métriques, avertissements qualité).

## Banc qualité

```bash
python bench/bench.py dossier_photos/ sortie_bench/
```

## Tests

```bash
python -m pytest -q
```

Images d'essai (non versionnées) : `python -c "from skimage import data; from PIL import Image; Image.fromarray(data.astronaut()).save('samples/astronaut.png')"`.

## Modules

| Module | Rôle |
|---|---|
| `geometry` | Gabarit versionné (`boards/*.json`), positions en mm, repères A1–D60 |
| `faces` | Détection du visage (YuNet, repli Haar) et cadrage automatique |
| `imaging` | EXIF, recadrage, luminance, normalisation, CLAHE, contours, fond éclairci (GrabCut), gamma, contrôle qualité |
| `lines` | Pré-calcul des 28 680 segments (format compact par clou) |
| `solver` | Glouton vectorisé, pénalité zones claires, écart minimal, pas de segment répété, déterministe |
| `render` | Simulation physique (sur-échantillonnage, épaisseur et opacité du fil), métriques |
| `instructions` | Longueur de fil, étapes lisibles, document JSON |
| `pipeline` | Orchestration et variantes |
