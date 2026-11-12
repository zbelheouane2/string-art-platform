# 01 — Analyse de la boutique Let's String

_Exploration du 2026-11-12, réalisée dans un navigateur réel (navigateur intégré Claude) en version desktop et mobile (375 × 812), à partir des endpoints publics Shopify `/products/*.js` et `/products.json`._

**Légende :**
- ✅ Observé et testé
- 📄 Issu de la documentation ou des textes publics
- 💭 Hypothèse technique
- ❓ Non vérifiable

## 1. Plateforme et outils

| Élément | Constat | Statut |
|---|---|---|
| CMS | **Shopify**, thème personnalisé « Design V3 » | ✅ |
| Langues | x-default, EN, ES, FR, DE (hreflang) ; sélecteur pays/devise dans l'en-tête | ✅ |
| Devise | EUR (taux 1.0) ; Shopify Markets pour pays et devise | ✅ |
| Marketing | Google Tag Manager, Meta Pixel, Microsoft Clarity (enregistrement de sessions), Klaviyo (emailing) | ✅ |
| Offres groupées | Application tierce de « bundles » (nice-team) | ✅ |
| Paiement | Shopify Checkout, Shop Pay (`shop.app`) | ✅ |
| Domaines liés | letsstring.store (boutique), letsstring.art (application), letsstring.pl (Pologne) | ✅ |

## 2. Identité visuelle

| Élément | Constat | Statut |
|---|---|---|
| Polices | **DM Sans** (texte) et **DM Serif Display** (titres, avec un mot en italique coloré) | ✅ |
| Couleurs | Brun très foncé `#2A1F1A` (texte), rouge brique `#A8322D` (accent et boutons), brun `#5A4A40`, crème `#FFFAF5`, beiges `#EADBCD`, `#F6ECE2` | ✅ |
| Style | Chaleureux, « cadeau émotionnel », photos lifestyle (couples, familles), coins arrondis, boutons en pilule | ✅ |
| Signature | Médaillon circulaire montrant le rendu en fil superposé à la photo du cadeau | ✅ |
| Interaction | Curseur avant/après « photo ↔ fil » | 📄 (texte « Faites glisser le curseur ») |

> Pour notre marque : ne reprendre ni les couleurs, ni le logo, ni les photos, ni les textes. Seuls les principes peuvent servir (ton chaleureux, cadeau, avant/après).

## 3. Architecture des pages

**En-tête :** bandeau de livraison, menu (Idées cadeaux, Qu'est-ce que Let's String, FAQ, Livraison, Blog, Vente en gros, Contact, Suivre ma commande), recherche, panier, pays et langue. ✅

**Page d'accueil = page produit unique** (one-product store). Sections dans l'ordre ✅ :
1. **Hero** : badge « Idée cadeau », titre émotionnel, CTA « Offrir le cadeau −30 % ».
2. **Réassurance** : note 4,88 (118 avis), retours 14 jours, livraison dès 2 jours, « Vu dans » (presse), « plus de 8 000 portraits », « vendeur européen ».
3. **Idées cadeaux par cible** : couples, parents, grands-parents, animaux, deuil ou souvenir, soi-même.
4. **Avant/après** interactif.
5. **Ce que contient le cadeau** : les 3 étapes (photo → modèle → fil guidé par la voix), matériaux, contenu.
6. **Comment l'offrir** : on offre la boîte, le destinataire choisit sa photo, le code n'expire jamais.
7. **Bloc d'achat intégré** : prix, formules, ventes additionnelles, ajout au panier.
8. **Réactions vidéo** (UGC) et avis clients (172).
9. **FAQ**.
10. **CTA final**.
11. **Barre d'achat collante** (sticky) en bas d'écran.

**Pied de page :** Kit, FAQ, Livraison, Blog, Vente en gros, Contact, Suivi de commande, B2B, **Code supplémentaire**, pages légales. ✅

## 4. Catalogue et prix (endpoints publics Shopify)

| Produit | Prix | Statut |
|---|---|---|
| Let's String Kit (SKU `LS1`, variante unique) | **119 €** (prix barré 170 €) | ✅ |
| Formule 2 kits (2e à −20 %) | 214,20 € | ✅ |
| **Additional Code** (code supplémentaire) | **25 €** | ✅ |
| Tableaux **déjà réalisés** (Wolf, Mandala, Lion, Frida Kahlo…) | **439 €** chacun | ✅ |
| Support Let's String | 5,99 € | ✅ |
| Bougie vanille | 9,99 € | ✅ |

**Lecture :** trois sources de revenus. Le kit, les codes supplémentaires (récurrence, puisque le fil couvre 3 tableaux) et les œuvres finies vendues à prix élevé. 💭

## 5. Expérience d'achat

- Un seul produit, sans choix de taille ni de couleur. La variante unique simplifie tout. ✅
- La formule « 2 kits » sert à augmenter le panier moyen. ✅
- Ventes additionnelles dans le bloc d'achat (support, bougie). ✅
- Livraison : +16 €, 2 à 5 jours ouvrés, expédié sous 24 h depuis l'UE, date limite pour Noël. ✅
- Le tunnel de paiement n'a pas été testé : aucune commande passée. ❓

## 6. Réassurance

Avis (note et nombre), presse, compteur « 8 000+ portraits », retours sous 14 jours, livraison rapide, vendeur européen, vidéos de réactions, FAQ, équipe disponible. ✅

**Incohérence :** la note varie selon les sections (4,88 sur 118 avis, puis « Based on 172 reviews »). Trustpilot affiche 3,9 sur 20 avis. 📄

## 7. Responsive

- **Mobile :** en-tête compact (menu burger, logo centré, recherche, panier), hero empilé, barre d'achat collante avec vignette, prix et bouton. Le rendu est propre. ✅ (capture `captures/store-accueil-mobile.jpg`)
- **Desktop :** bandeau, en-tête avec pays/langue, hero en grande photo. ✅ (capture `captures/store-accueil-desktop.jpg`)

## 8. Enseignements pour notre boutique

1. **Une seule page produit très riche** convertit mieux qu'un catalogue pour un produit unique.
2. Un **positionnement « cadeau »** : segmentation par destinataire, date limite pour les fêtes, emballage.
3. Le **code supplémentaire** comme produit récurrent.
4. Des **œuvres finies** comme offre haut de gamme, facultative.
5. Une **barre d'achat collante** sur mobile.
6. Shopify suffit pour l'Europe. Pour l'Algérie, il faut un paiement à la livraison et des transporteurs locaux, que Shopify gère mal (voir `05-technical-architecture.md`).
