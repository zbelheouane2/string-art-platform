# Composants

Mesurés sur la boutique de référence (styles calculés, largeur 1024 px). Jetons : `tokens.json` → `tokens.css` (généré par `gen_tokens.py`, copié dans `apps/web/src/styles/tokens.css`). Le site n'utilise pas Tailwind : les composants lisent les variables CSS ; `tailwind.theme.cjs` est prêt si on l'adopte un jour. Page de contrôle : `/fr/design` (avec `ENABLE_DESIGN_PAGE=1`).

Écrans : S01 accueil (seul écran construit). Tout est en propriétés CSS logiques (arabe RTL).

```
Bouton (.btn)
  variantes  primary (fond accent), outline (contour text 1,5 px, fond transparent), icon (.icon-btn, 44 px, rond)
  tailles    normal 48 px ; lg 56 px, marges 30 px, 17 px / 600
  états      repos, survol (accent-hover / outline inversé), appui (descend de 1 px),
             focus-visible (anneau 2 px accent, décalage 3 px), désactivé (fond beige, texte muted, curseur interdit)
  jetons     radius pill, motion fast ease-in-out
  a11y       vrai <button> ou <a> selon l'action ; le bouton désactivé garde son libellé
  utilisé    S01 héros, fiche produit, appel final, barre collante

Bandeau d'annonce (.announcement)
  jetons     fond inverse, texte on-inverse, 14 px / 500, hauteur ~41 px
  a11y       simple <p>, pas de défilement automatique

En-tête (.site-header)
  structure  menu (gauche) · logo centré · langues + panier (droite), hauteur 77 px, collant, filet border en bas
  états      tiroir de navigation ouvert/fermé (aria-expanded, Échap ferme), langues masquées < 768 px (présentes dans le tiroir et le pied)
  a11y       logo = lien texte (nom de marque), panier avec aria-label

Sélecteur de langue (.lang-switch)
  états      langue courante (aria-current, fond sand), survol (blush)
  a11y       aria-label « FR – Français » qui contient le texte visible, lang/hreflang sur chaque lien

Carte héros (.hero-media)
  jetons     fond surface-sand, radius lg, pastille (.badge) blanche ombre pop, médaillon rond bordure 6 px surface ombre hero
  contenu    planche animée (vraie séquence du moteur), mouvement réduit = portrait fini

Sur-titre (.eyebrow)
  jetons     accent, 13 px / 700, capitales, interlettrage 0,12 em (0 en arabe)

Titre H1
  jetons     DM Serif Display 64 px (fluide dès 42 px), accent en italique couleur accent (pas d'italique en arabe)

Bande de réassurance (.trust)
  jetons     fond bg, filets border haut/bas, coches accent, 14 px / 600

Carte cadeau (.gift-card)
  jetons     image carrée radius lg fond beige, H3 26 px fluide, texte muted 14 px
  états      visuel provisoire étiqueté tant qu'il n'y a pas de photo réelle
  grille     2 colonnes mobile, 3 dès 960 px

Curseur avant/après (.ba)
  jetons     radius lg, ombre card, poignée ronde blanche ombre pop, étiquettes pilules
  états      position 0–100 %, focus clavier (anneau accent sur le cadre)
  a11y       <input type="range"> avec aria-label ; flèches clavier ; reste en LTR (photo à gauche)

Étapes numérotées (.num-steps)
  jetons     pastille 48 px accent, chiffre DM Serif ; variante cols-3 centrée dès 768 px
  a11y       vraie liste <ol>

Galerie produit (.gallery)
  jetons     image carrée radius lg, compteur pilule « 1 / 4 » (toujours LTR), flèches rondes ombre pop, vignettes 72 px
  états      vignette active (aria-current, bordure text), flèches inversées en RTL
  a11y       boutons avec aria-label, rôle carousel

Fiche produit (.shop-info)
  contenu    titre H2, accroche, prix (ou « Prix bientôt disponible »), liste à coches, bouton pleine largeur, note paiement
  états      sans prix : bouton désactivé « Bientôt disponible »

Accordéon FAQ (.faq-list)
  jetons     filets border, question 18 px / 600, icône + qui tourne de 45° à l'ouverture
  a11y       <details>/<summary> natifs, ouverture au clavier testée

Appel final (.final)
  jetons     fond surface, médaillon rond 144 px, bouton primary lg

Pied de page (.site-footer)
  jetons     fond bg (blanc, comme la référence), filet border en haut, titres en sur-titre, liens text → accent au survol
  colonnes   marque · menu · contact · langues

Barre d'achat collante (.sticky-bar)
  jetons     fond bg, filet border, ombre sticky, vignette 48 px radius sm, bouton primary
  états      cachée tant que les boutons du héros sont visibles (inert + aria-hidden), masquée dès 960 px
```

Non construits faute de contenu réel : avis clients, note, presse, vidéos de réaction, recherche, tiroir panier.
