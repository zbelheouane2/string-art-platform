# 06 — Comparatif fonctionnel : Let's String et notre solution

**Légende :**
- ✅ Présent
- ➖ Absent
- 🔍 Lu dans le code public
- ❓ Non vérifié
- ⭐ Amélioration proposée

## Produit physique

| Fonction | Let's String | Notre solution |
|---|---|---|
| Format | 50 × 50 cm MDF, 240 clous en cercle | Identique (standard du marché) |
| Clous | Pré-posés, numérotés (marquage exact ❓) | Pré-posés, **secteurs A à D de 1 à 60**, repère « haut » ⭐ |
| Couleur de la planche | Blanche ou noire selon le pays 🔍 | Blanche au lancement ; noire plus tard (moteur déjà prêt pour l'inversion) |
| Fil | Noir, 1 bobine = 3 tableaux | Idem ; **porte-bobine anti-emmêlement** ⭐ |
| Chevalet / support | Boîte transformable, support vendu à part | Notice illustrée claire ⭐ |
| Réutilisation de la planche | Plainte : à découper | À étudier : planche réutilisable ou planche seule vendue ⭐ |

## Boutique

| Fonction | Let's String | Notre solution |
|---|---|---|
| Plateforme | Shopify | Sur mesure (option A, à valider) |
| Langues | EN, ES, FR, DE | **FR, EN, AR (RTL)** ⭐ |
| Paiement | Carte, Shop Pay | Carte + **paiement à la livraison + CIB/EDAHABIA** ⭐ |
| Livraison | FedEx, GLS, UPS (UE et international) | + **Yalidine et autres transporteurs locaux, point relais** ⭐ |
| Page produit unique | ✅ | ✅ |
| Formule 2 kits | ✅ | ✅ (à décider) |
| Code supplémentaire | ✅ 25 € | ✅ |
| Œuvres finies | ✅ 439 € | Plus tard (facultatif) |
| Positionnement cadeau | ✅ | ✅ + fêtes locales (Aïd, Ramadan, Fête des mères) ⭐ |
| Confirmation de commande | Email | Email + **WhatsApp** ⭐ |

## Générateur

| Fonction | Let's String | Notre solution |
|---|---|---|
| Code d'activation | 8 caractères `XXXX-XXXX` | 8 caractères **sans caractères ambigus + clé de contrôle** ⭐ |
| Limite d'usage | 3 envois d'email, puis code inactif 🔍 | **1 portrait validé, PDF retéléchargeable**, essais libres ⭐ |
| Galerie de modèles | ✅ (célébrités) | ✅ **modèles libres de droits** |
| Import | `image/*`, 15 Mo | JPG, PNG, WebP, **HEIC**, 15 Mo |
| Contrôle qualité de la photo | ➖ (vérification manuelle par email) | **Automatique** (netteté, exposition, visage) ⭐ |
| Recadrage | ✅ | ✅ + **centrage automatique sur le visage** ⭐ |
| Variantes | ✅ (aperçus dans le navigateur) | ✅ 3 à 5, **calculées par le même moteur** ⭐ |
| Génération définitive | 5 à 10 min, rester sur la page | Quelques secondes à 1 min, **en arrière-plan avec notification** ⭐ |
| Reproductibilité | Graine fixe 🔍 | Graine, version du moteur, empreinte de l'image |
| Contrôle du rendu trop sombre | ➖ | ✅ métrique d'histogramme ⭐ |
| Longueur de fil affichée | ➖ | ✅ ⭐ |
| PDF | ✅ | ✅ gabarit à l'échelle et séquence lisible |

## Assistant de réalisation

| Fonction | Let's String | Notre solution |
|---|---|---|
| Voix | MP3 pré-enregistrés (7 langues) | MP3 composés **FR/EN/AR** ⭐ |
| Musique | 7 ambiances | Ambiances libres de droits |
| Vitesse | 0,5× à 5× | Idem |
| Pause / reprise | ✅ | ✅ |
| Reprise après interruption | Saisie manuelle de l'étape | **Sauvegarde automatique** à chaque fil, multi-appareil ⭐ |
| « Je suis perdu » | ✅ (comportement ❓) | Affichage des 2 derniers clous et retour en arrière ⭐ |
| Toucher un clou | ✅ | ✅ + recherche par repère (« C47 ») ⭐ |
| Écran toujours allumé | ❓ | ✅ Wake Lock ⭐ |
| Hors connexion | ❓ | ✅ PWA ⭐ |
| Temps restant estimé | ❓ | ✅ ⭐ |

## Back-office

| Fonction | Let's String | Notre solution |
|---|---|---|
| Gestion des codes par lots | ✅ 🔍 | ✅ + export pour l'imprimeur, statuts, traçabilité |
| Commandes | Shopify | Intégré |
| Statistiques de génération | ❓ | ✅ (durée, erreurs, qualité) |
