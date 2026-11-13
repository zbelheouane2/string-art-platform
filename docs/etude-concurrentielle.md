# Étude concurrentielle et de marché

_Version du 2026-11-12. Sources publiques uniquement. Les chiffres non confirmés par une source officielle sont signalés comme tels._

## 1. Résumé

- Le marché du portrait String Art personnalisé est structuré autour d'un même modèle : **kit générique, personnalisation après achat via un code**, et assistant de montage, souvent vocal.
- Le standard technique observé est : **planche carrée de 50 × 50 cm, clous disposés en cercle, environ 240 clous, environ 3 500 à 3 700 étapes, un seul fil noir continu, 6 à 13 heures de montage**.
- Les faiblesses récurrentes des concurrents sont les délais de livraison en période de fêtes, un support client lent, un plateau non réutilisable ou non vendu seul, un rendu parfois trop sombre et un montage du chevalet confus.
- En Algérie, aucun acteur local identifié. Le marché fonctionne à environ 95 % en paiement à la livraison. Fabriquer localement évite les droits d'importation élevés.

## 2. Concurrent principal : Let's String (letsstring.store)

| Élément | Constat | Source |
|---|---|---|
| Prix | 119 € (affiché « au lieu de 170 € »), 2 kits à 214,20 € | Fiche produit |
| Planche | MDF 50 × 50 cm, peinture, clous numérotés déjà posés en cercle | Fiche produit |
| Nombre de clous | Non publié | — |
| Étapes | « environ 3 700 étapes », 3 500 selon certains avis | Fiche produit, avis |
| Fil | Noir, un seul fil continu, 1 bobine = 3 tableaux | Fiche produit, FAQ |
| Durée | 6 h annoncées, 7 à 13 h selon les avis | Fiche produit, avis |
| Contenu | Planche, fil, boîte transformable en chevalet, support téléphone, notice, code d'activation | Fiche produit |
| Personnalisation | Code de 8 caractères sur letsstring.art, sans expiration, PDF téléchargeable 3 fois par motif | FAQ |
| Assistant | Guidage vocal multilingue, musique, vitesse réglable, pause et reprise | Accueil, fiche produit |
| Service | Vérification gratuite de la photo, retour sous 14 jours | FAQ |
| Upsell | Support bois 5,99 €, bougie 9,99 €, codes supplémentaires | Accueil |
| Livraison | Préparation sous 24 h, FedEx, GLS, UPS, 16 € en Europe, 3 à 5 jours ; Émirats, Israël, Australie… | Politique de livraison |
| Avis | 4,97/5 sur le site (172 avis) ; 3,9/5 sur Trustpilot (20 avis) | Site, Trustpilot |

**Plaintes relevées sur Trustpilot :**
- Retards d'expédition à Noël, avec des cadeaux arrivés trop tard.
- Fil qui s'emmêle sur le porte-bobine.
- Plateau à découper après un tableau, et non vendu séparément.
- Chevalet et emballage jugés confus.
- Application qui n'a pas traité une image.
- Support client lent selon certains clients.
- Prix jugé élevé.

## 3. Autres concurrents

| Marque | Constat |
|---|---|
| RingString | MDF 50 × 50 cm, **240 clous fixes**, QR code vers le logiciel, **5 variantes de rendu proposées par photo**, guidage vocal (choix de la voix, vitesse, musique), support de bobine, crochet mural, support téléphone. Environ 138 £ livraison incluse. Un avis signale un rendu trop sombre. |
| String Ring | Format en anneau, lancé sur Kickstarter en septembre 2025, guidage vocal ou à l'écran. |
| Qbrix et autres | Kits personnalisés similaires vendus sur les marketplaces. |
| Générateurs gratuits | Outils en ligne (madegooddesigns, projets open source) : génèrent une séquence, sans kit ni assistant. Ce ne sont pas des concurrents directs, mais ils montrent que l'algorithme de base est connu. |

**Conclusion :** la configuration « 240 clous en cercle sur 50 × 50 cm » est un standard de fait. L'hypothèse de 4 secteurs de 60 clous (A à D) est cohérente avec cela.

## 4. État de l'art de l'algorithme

- **Approche standard, gloutonne :** depuis le clou courant, on évalue toutes les lignes possibles et on retient celle qui réduit le plus l'erreur avec l'image cible. On « soustrait » ensuite la ligne et on recommence. Plusieurs implémentations publiques existent (GitHub, articles Hackaday).
- **Travaux académiques :** RWTH Aachen et Bridges 2022 portent sur l'optimisation globale, la modélisation physique du fil et la perception à distance. Ils sont utiles pour dépasser la qualité de l'approche gloutonne.
- **Notre différenciation possible :**
  - Prétraitement centré sur le visage.
  - Modélisation réaliste de l'épaisseur et de l'opacité du fil.
  - Plusieurs variantes proposées par photo, comme le fait RingString.
  - Contrôle du rendu trop sombre.
  - Métriques combinées (erreur pixel et similarité structurelle).
  - Calibrage sur des réalisations physiques réelles.
- **Licences :** aucun code tiers ne doit être repris sans vérifier sa licence. Le moteur sera développé en interne.

## 5. Marché algérien

_Les chiffres proviennent principalement d'un article de blog et sont à confirmer._

- **Paiement :**
  - Environ 95 % des commandes sont payées à la livraison.
  - Les refus à la livraison représentent 15 à 20 % dans les grandes villes et plus de 30 % dans certaines wilayas du Sud.
  - Le paiement en ligne passe par CIB et EDAHABIA (passerelle SATIM, agrégateurs comme Chargily Pay) et reste minoritaire.
- **Livraison :**
  - Yalidine : plus de 160 agences, 56 wilayas couvertes, livraison sous 24 h dans le Nord.
  - Autres transporteurs : Maystro, ZR Express.
  - Coût de 300 à 600 DZD dans le Nord. L'intégration se fait souvent par API propre ou manuellement.
- **Relation client :** WhatsApp est le canal principal, avec une confirmation téléphonique ou WhatsApp avant expédition pour réduire les refus.
- **Panier moyen e-commerce :** environ 2 500 à 6 000 DZD. Un kit premium se situera au-dessus, d'où l'importance de la perception cadeau et de la qualité.
- **Import :** les droits additionnels (DAPS) vont de 30 à 200 %. **La fabrication locale des planches, clous et fil est un avantage décisif.**
- **Réglementation :** la loi 18-05 sur le e-commerce impose un registre du commerce et, selon certaines lectures, un hébergement en Algérie. **À vérifier avec un juriste.** Ce point peut influencer l'architecture d'hébergement.

## 6. Recommandations pour notre projet

1. **Garder le standard** de 50 × 50 cm et 240 clous en cercle, validé par la concurrence, puis le confirmer par notre prototype.
2. **Les deux parcours de vente** : « créer puis acheter » en ligne, et kit avec code d'activation pour le cadeau, les revendeurs et l'Algérie.
3. **Paiement à la livraison et confirmation WhatsApp** dès le lancement en Algérie. Pour limiter les refus, envisager un acompte ou le paiement du patron numérique en ligne.
4. **Corriger les faiblesses des concurrents :**
   - Plateau réutilisable ou vendu seul.
   - Recharges de fil.
   - Porte-bobine anti-emmêlement.
   - Notice de chevalet illustrée.
   - Support réactif via WhatsApp.
   - Contrôle automatique du rendu trop sombre.
5. **Proposer 3 à 5 variantes de rendu par photo**, devenu un standard du marché.
6. **Guidage vocal en arabe, français et anglais**, ce qui nous différencie sur le Maghreb et le Golfe.
7. **Anticiper les pics de fêtes** (Aïd, Ramadan, Fête des mères, Noël) avec des stocks de kits génériques prêts.

## 7. Sources

- Let's String : [accueil](https://letsstring.store/fr), [fiche kit](https://letsstring.store/fr/products/letsstring-kit), [FAQ](https://letsstring.store/fr/pages/faq), [Trustpilot](https://au.trustpilot.com/review/letsstring.store)
- RingString : [fiche revendeur](https://www.desertcart.co.uk/products/668552350-ringstring-art-kit-for-string-art-creation-from-any-photo.md)
- String Ring : [ProductHype](https://product-hype.beehiiv.com/p/latest-hype-string-ring)
- Algorithme :
  - [kaspar98/StringArt](https://github.com/kaspar98/StringArt)
  - [Hackaday](https://hackaday.com/2021/03/18/an-algorithm-for-art-thread-portraits)
  - [RWTH Aachen](https://www.graphics.rwth-aachen.de/media/papers/351/paper_resampled_600.pdf)
  - [Bridges 2022](https://archive.bridgesmathart.org/2022/bridges2022-63.pdf)
- Algérie : [EasySell, COD Algérie 2026](https://easysellapp.com/blogs/wiki/algeria-ecommerce-cod-market-entry-shopify-2026), [AlgeriaTech](https://algeriatech.news/algeria-web-merchants-ecommerce-growth-2026/)
