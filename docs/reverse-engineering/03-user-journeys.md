# 03 — Cartographie des parcours utilisateurs

**Légende :**
- ✅ Observé
- 🔍 Lu dans le code public
- 📄 Documentation
- 💭 Hypothèse

## 1. Parcours Let's String

### 1.1 Achat (boutique Shopify)

```
Publicité / réseaux sociaux ──► Accueil (page produit unique) ✅
   ├─ choix de la formule : 1 kit / 2 kits ✅
   ├─ ventes additionnelles : support, bougie ✅
   └─ Ajouter au panier ─► Checkout Shopify / Shop Pay 💭 ─► Email de confirmation (Klaviyo) 💭
                                                        └─► Expédition sous 24 h, 2 à 5 jours 📄
```

### 1.2 Activation et création (application)

```
Ouverture de la boîte ─► Manuel papier ─► QR code ou letsstring.art 📄
 └─► Accueil appli ✅ ── « Télécharger une photo » ──► /verify : code XXXX-XXXX ✅🔍
     │                └─ « Choisir un modèle » ─► /designs (galerie, sans code) ✅
     │                                            └─ Sélectionner ─► code demandé 💭
     ▼
 [selon le pays] Choix de la planche blanche ou noire 🔍
     ▼
 Import de la photo (≤ 15 Mo) 🔍 ─► Recadrage 🔍
     ▼
 Aperçus de variantes dans le navigateur, sélection 🔍
     │   (possibilité d'essayer une autre image) 🔍
     ▼
 Génération serveur (5 à 10 minutes, rester sur la page) 🔍
     ▼
 Saisie de l'email ─► confirmation « Cet email est-il correct ? » 🔍
     │   ⚠ 3 envois maximum, puis le code devient inactif 🔍
     ▼
 Écran final : « Commencer l'assemblage en ligne » / « Télécharger le PDF » 🔍
```

### 1.3 Réalisation (assistant)

```
Lien email ─► /assembly/:sessionId 🔍
 ├─ Introduction vocale 🔍
 ├─ Réglages : musique, volume, vitesse 0,5× à 5× 🔍
 ├─ Boucle sur 3 500 étapes : annonce « numéro de clou » ─► le client tend le fil ─► pause ─► suivant 🔍
 ├─ Pause / reprise 📄
 ├─ Interruption : saisir l'étape où l'on s'est arrêté, ou toucher le clou 📄🔍
 ├─ « Je suis perdu » 🔍
 └─ Fin : tableau terminé, environ 6 h (7 à 13 h selon les avis) 📄
```

### 1.4 Parcours cadeau

L'acheteur offre la boîte. Le destinataire active le code plus tard, puisque le code n'expire jamais. L'acheteur n'a pas besoin de connaître la photo. 📄

### 1.5 Parcours de réachat

Un **code supplémentaire à 25 €** permet un nouveau portrait avec le fil restant. 📄✅ Le fil d'une bobine suffit pour 3 tableaux. Une nouvelle planche est nécessaire ou non, selon les avis. 📄

## 2. Points de friction relevés

| Friction | Source |
|---|---|
| Génération longue (5 à 10 min) sans pouvoir quitter la page | 🔍 |
| Limite de 3 envois d'email, puis le code est « brûlé », ce qui génère de l'anxiété | 🔍 |
| Pas de compte : tout repose sur le lien reçu par email | 🔍 |
| Retrouver l'étape après une pause : il faut noter le numéro | 📄 |
| Plateau à découper ou non réutilisable pour un 2e tableau | 📄 avis |
| Chevalet et emballage jugés confus | 📄 avis |
| Rendu parfois trop sombre | 📄 avis (concurrent) |

## 3. Parcours cibles pour notre solution

### 3.1 Achat
Page produit unique, paiement en ligne (international) **ou paiement à la livraison avec confirmation WhatsApp** (Algérie). Suivi de commande.

### 3.2 Activation
QR code, code `XXXX-XXXX` sans caractères ambigus, choix de la photo **ou** d'un modèle maison, puis **contrôle qualité de la photo**, recadrage centré sur le visage, 3 à 5 variantes, validation, génération en arrière-plan **avec notification** (sans obligation de rester sur la page), puis accès à l'assistant.

### 3.3 Réalisation
Assistant mobile en plein écran, écran maintenu allumé, voix FR/EN/AR, **sauvegarde automatique de l'étape à chaque fil** (sans saisie manuelle), reprise sur un autre appareil, recherche d'un clou, et un mode « je suis perdu » qui montre visuellement les deux derniers clous.

### 3.4 Après-vente
PDF retéléchargeable depuis l'espace lié au code, code supplémentaire, support WhatsApp.
