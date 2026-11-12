# 08 — Questions ouvertes, informations non vérifiées et tests nécessaires

## 1. Ce qui n'a pas pu être vérifié (blocage : code d'activation)

Les écrans après la saisie du code n'ont **pas** été utilisés. Aucun code n'a été deviné ou testé, conformément à la consigne de ne pas contourner les protections.

| # | Question | Comment la lever |
|---|---|---|
| 1 | Déroulé exact : recadrage (carré ou rond ?), nombre de variantes affichées | Acheter un kit ou un code supplémentaire (25 €) et faire le parcours, avec captures |
| 2 | Contenu et mise en page du PDF | Idem |
| 3 | ~~Marquage physique des clous~~ **Résolu (info du porteur de projet)** : 4 zones A, B, C, D de 60 clous (1 à 60), **fond alterné noir / blanc / noir / blanc**, instructions du type « A1 → D56 ». Reste à confirmer : position de A1 et sens de numérotation (horaire ou antihoraire) | Kit physique ou photo |
| 4 | Diamètre et type du fil, diamètre des clous, diamètre réel du cercle | Kit physique (mesures) |
| 5 | Comportement de « Je suis perdu » | Kit ou code |
| 6 | Règle exacte : « 3 envois d'email, puis code inactif ». Un code = un portrait ? Comment « jusqu'à 3 tableaux » se combine-t-il avec la vente de codes à 25 € ? | Kit ou code ; question au support |
| 7 | Le choix planche blanche ou noire dépend-il vraiment du pays ? | Parcours réel |
| 8 | La sauvegarde de progression se fait-elle à chaque étape ? | Parcours réel |
| 9 | Format exact des données API (séquence, coordonnées) | Parcours réel (observation réseau, sans appel manuel) |
| 10 | L'aperçu repose-t-il réellement sur le projet GPL de piellardj ? | Non essentiel pour nous |

**Recommandation : acheter un kit Let's String (119 € + 16 € de port).** C'est le moyen le plus fiable et le moins cher pour lever les points 1 à 9 d'un coup, et ça sert de référence physique.

## 2. Décisions qui te reviennent

| # | Décision | Recommandation |
|---|---|---|
| D1 | Commerce sur mesure ou Shopify (voir `05` §8) | Sur mesure (option A) |
| D2 | Numérotation | **Validé : secteurs A à D, 1 à 60, zones alternées noir/blanc** |
| D3 | Règle d'usage d'un code (portraits, essais, PDF) | 1 portrait validé, essais libres, PDF illimité |
| D4 | Planche noire en plus de la blanche au lancement ? | Non, blanche seule au lancement |
| D5 | Galerie de modèles prêts au lancement ? | Oui, 10 à 20 modèles libres de droits |
| D6 | Langues de la voix | FR, EN, AR (darija plus tard) |
| D7 | Durée de conservation des photos | 30 jours après validation |
| D8 | Fabrication de la planche : gabarit papier, perçage CNC, fournisseur ? | À étudier avec un artisan local |
| D9 | Nom de marque | En discussion |

## 3. Points juridiques et marché à confirmer

- **Loi algérienne 18-05** : obligation d'hébergement local, registre du commerce, mentions obligatoires. À voir avec un juriste.
- **Paiement en ligne en Algérie** : conditions d'agrément CIB/EDAHABIA via SATIM ou un agrégateur (Chargily, etc.).
- Les chiffres du paiement à la livraison (95 %, 15 à 30 % de refus) viennent d'un blog spécialisé et sont **à confirmer**.
- Droits sur les modèles de galerie : ne pas utiliser d'images de célébrités sans licence.

## 4. Tests nécessaires

| Test | Objectif |
|---|---|
| Banc d'essai du moteur sur 30 photos (portrait, couple, enfant, animal, sombre, clair, fond chargé) | Choix des paramètres |
| Comparaison simulation / photo d'un tableau réel | Calibrage de l'opacité et de l'épaisseur |
| Mesure de la longueur de fil réelle par rapport au calcul | Composition du kit (bobine) |
| Chronométrage d'une réalisation complète avec l'assistant | Réglage de la vitesse et estimation affichée |
| Tests d'utilisabilité de l'assistant sur mobile (à côté de la planche) | Ergonomie |
| Test d'impression du gabarit PDF à l'échelle 1:1 | Précision de pose des clous |
