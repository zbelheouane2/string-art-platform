# Design

Système visuel de la plateforme (étape 1, page d'accueil). Inspiré de la **structure** de la boutique de référence (bandeau, en-tête avec logo et langues, grand visuel arrondi, sections produit, barre d'achat mobile), avec une **identité propre** : aucune couleur, police, photo ni texte de la référence (cahier des charges §1.3).

## Monde

L'objet du produit : une planche blanche, des clous laiton, un fil noir. La couleur d'accent, émeraude, évoque le cadeau et l'Algérie sans reprendre le rouge brique de la référence.

| Jeton | Valeur | Rôle |
|---|---|---|
| `--paper` | `#ffffff` | Fond principal, la planche |
| `--plaster` | `#f1f0ec` | Sections secondaires |
| `--ink` | `#1a1916` | Texte, fil, bandeau, pied de page |
| `--ink-soft` | `#55524c` | Texte secondaire (contraste 7,6:1 sur blanc) |
| `--emerald` | `#0e5443` | Actions principales, champ « cadeau » |
| `--brass` | `#a9803f` | Clous et repères A–D (décoratif, jamais pour du texte courant) |

## Typographie

- Titres : **Young Serif** (latin), **Noto Naskh Arabic** (arabe).
- Texte : **Figtree** (latin), **Alexandria** (arabe).
- Échelle fluide `--step--1` à `--step-4` ; titres sans capitales ni mot isolé en italique.

## Signature

La planche du héros tisse en direct le **vrai calcul du moteur** (séquence de 1 913 fils, repères A1–D60). Mouvement unique de la page ; en « mouvement réduit », le portrait apparaît terminé.

## Règles

- Propriétés CSS logiques partout : la page se retourne en arabe ; la planche, objet physique, ne se retourne pas, et les repères de clous restent écrits de gauche à droite.
- Boutons en pilule, cartes à grand rayon (1,75 rem) seulement pour les objets (la planche), listes à filets pour le contenu.
- Étapes numérotées uniquement parce qu'il s'agit d'une vraie séquence.
- Accessibilité : WCAG 2.1 AA vérifié automatiquement (axe) en FR, EN, AR, mobile et bureau.
