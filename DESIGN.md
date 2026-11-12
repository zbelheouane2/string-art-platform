# Design

Système visuel de la page d'accueil (étape 1, version 2).

**Décision du propriétaire (2026-11-12)** : la page doit être « identique » à la boutique de référence, sauf le logo et des visuels. Cela remplace la règle de distinction du cahier des charges §1.3 pour la **mise en page, les couleurs et le style des polices**. Restent à nous, pour des raisons de droit d'auteur et de concurrence déloyale : le **logo**, les **textes** (mêmes idées, nos mots), les **photos/visuels** et le **code**. Aucun avis, note, presse ni vidéo de réaction n'est affiché tant qu'on n'en a pas de vrais.

## Structure (même ordre que la référence)

Bandeau d'annonce → en-tête (menu, logo centré, langues, panier) → héros (carte visuelle avec pastille « Idée cadeau » et médaillon photo, sur-titre rouge, titre avec accent italique rouge, deux boutons pilule) → bande de réassurance → idées cadeaux (6 cartes) → « dans la boîte » (curseur photo/fil + 3 étapes numérotées) → « l'offrir » (3 étapes + bloc « seul, ou à deux ») → fiche produit (galerie « 1 / 4 », inclus, bouton) → FAQ en deux colonnes → appel final → pied de page → barre d'achat collante sur mobile.

## Jetons

| Jeton | Valeur | Rôle |
|---|---|---|
| `--white` | `#ffffff` | Héros, en-tête |
| `--cream` | `#fffaf5` | Sections cadeaux, produit, appel final |
| `--sand` | `#f6ece2` | Sections « dans la boîte », FAQ, carte du héros |
| `--blush` | `#f3ded3` | Section « l'offrir » |
| `--beige` | `#eadbcd` | Fonds de visuels, bouton désactivé |
| `--ink` | `#2a1f1a` | Texte, bandeau, pied de page |
| `--ink-soft` | `#6b5a50` | Texte secondaire |
| `--accent` | `#a8322d` | Boutons, sur-titres, accent du titre, puces |
| `--brass` | `#a9803f` | Clous et repères A–D (décoratif) |

## Typographie

- Titres : **DM Serif Display** (accent en italique) ; arabe : **Noto Naskh Arabic**.
- Texte : **DM Sans** ; arabe : **Alexandria**.
- Boutons pilule de 56 px, 17 px, graisse 600.

## Visuels provisoires

Rendus réels du moteur (astronaute, chat, photographe) et motif de fil décoratif, marqués « Visuel provisoire ». À remplacer par les photos du kit.

## Règles

- Propriétés CSS logiques partout : la page se retourne en arabe ; la planche et le curseur photo/fil ne se retournent pas, les repères de clous restent écrits de gauche à droite.
- Prix, devise, pays : jamais en dur (`src/config/catalog.ts`, base de données). Sans prix, le bouton d'achat est désactivé.
- WCAG 2.1 AA vérifié par axe dans les tests navigateur.
