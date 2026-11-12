# 05 — Architecture technique recommandée

_Proposition à valider. Rien n'est développé tant que tu n'as pas validé (CLAUDE.md §3)._

## 1. Principes
- **Un seul moteur** (Python) produit la séquence officielle. L'aperçu, le PDF et l'assistant lisent tous cette même séquence.
- Séparation nette : boutique, générateur, moteur, services transverses.
- Une seule géométrie au lancement (planche de 50 × 50 cm, 240 clous, 4 secteurs), décrite par un **fichier de configuration versionné**, ce qui permet d'ajouter d'autres formats plus tard.
- Photos clients privées, URLs signées, durée de conservation limitée.

## 2. Vue d'ensemble

```
                ┌──────────────────────────── apps/web (Next.js, TypeScript) ───────────────────────────┐
 Client ──────► │ Boutique  │  Activation + Studio  │  Assistant (PWA mobile)  │  Back-office          │
                │  FR/EN/AR (RTL) — un seul front, routes séparées                                     │
                └───────┬───────────────────────────────┬─────────────────────────────┬──────────────────┘
                        │ API (Next route handlers)     │                             │
                ┌───────▼─────────┐            ┌────────▼────────┐          ┌─────────▼─────────┐
                │ PostgreSQL       │◄──────────│ File de tâches  │─────────►│ services/engine    │
                │ (Prisma)         │           │ (Redis + worker)│          │ Python / FastAPI   │
                └──────────────────┘           └─────────────────┘          │ imaging · geometry │
                        ▲                                                   │ solver · render    │
                ┌───────┴──────────┐   ┌───────────────────────┐            │ instructions (PDF) │
                │ Stockage S3 privé │   │ Paiements : adaptateurs│            └────────────────────┘
                │ photos, rendus, PDF│  │ COD · CIB/Edahabia · carte│
                └───────────────────┘   │ Livraison : adaptateurs  │
                                         └───────────────────────┘
```

## 3. Modules du moteur (`services/engine`)

| Module | Rôle | Entrées → sorties |
|---|---|---|
| `imaging` | Décodage (HEIC, EXIF), recadrage, niveaux de gris, normalisation, CLAHE, gamma, carte d'importance, contrôle qualité de la photo | photo + recadrage → matrice cible + score qualité |
| `geometry` | Gabarit versionné (`board-50x50-240-v1.json`) : clous en mm, repères A1 à D60, conversion vers les pixels | config → liste des clous |
| `solver` | Pré-calcul des segments (cache), glouton vectorisé, contrôle des répétitions, raffinement, graine | cible + géométrie + paramètres → séquence |
| `render` | Simulation réaliste en sur-échantillonnage, planche blanche ou noire, métriques (SSIM, MSE flouté, histogramme) | séquence → images + scores |
| `instructions` | Séquence lisible, longueur de fil, PDF (gabarit à l'échelle et étapes), JSON pour l'assistant | séquence → PDF + JSON |
| `api` | FastAPI : `/preview` (rapide, basse résolution, 3 à 5 variantes) et `/generate` (définitif), via le worker | — |

**Aperçu :** contrairement à Let's String, qui calcule ses aperçus dans le navigateur, nous recommandons des **aperçus calculés par le même moteur côté serveur**, en basse résolution, en quelques secondes. On évite ainsi deux implémentations qui divergent, et ce que le client voit correspond exactement à ce qu'il réalisera. Une animation côté navigateur se contente de rejouer la séquence reçue.

## 4. Application web (`apps/web`)

- **Next.js + TypeScript + Tailwind**, internationalisation FR/EN/AR avec **RTL**.
- **Boutique** : une page produit riche, panier, checkout, suivi de commande.
- **Activation** : `/activer` (code ou QR code), studio (import, recadrage, variantes, validation).
- **Assistant** : PWA installable, mode hors connexion une fois la séquence chargée, Wake Lock (écran allumé), voix, sauvegarde de l'étape à chaque fil, reprise sur un autre appareil via un lien ou un compte.
- **Back-office** : commandes, codes (lots, statuts, export CSV pour l'impression), générations, paramètres du moteur, marchés.

## 5. Codes d'activation

- **Alphabet sans caractères ambigus** (Crockford Base32 : sans I, L, O, U). 8 caractères au format `XXXX-XXXX`, soit 32⁸ ≈ 10¹² combinaisons, plus **une clé de contrôle** pour détecter les fautes de frappe sans appeler le serveur.
- Génération **cryptographiquement aléatoire** par lots. En base, on stocke le **hash**, le lot, le statut (créé, imprimé, vendu, activé, épuisé, désactivé), la géométrie compatible et les quotas (portraits validés, générations d'essai, téléchargements).
- **Anti-force brute** : limite de tentatives par adresse IP et par appareil, délai croissant, CAPTCHA après plusieurs échecs.
- Export CSV ou QR pour l'imprimeur. Traçabilité de chaque utilisation.
- **Règle plus claire que Let's String** : un code donne un portrait validé, avec des essais illimités avant validation et un PDF retéléchargeable. Pas de risque de code « brûlé » par des envois d'email.

## 6. Voix de l'assistant

Fichiers audio **pré-enregistrés**, comme Let's String, mais **composés** :
- 4 lettres (A à D) et 60 nombres (1 à 60) par langue, soit **64 fichiers par langue** au lieu de 240.
- L'annonce se fait par concaténation (« B » puis « 17 »).
- Langues : FR, EN, AR, éventuellement darija plus tard.
- Musiques d'ambiance libres de droits, réglage de vitesse.

## 7. Données (extrait, complète `cahier-des-charges.md` §15)

`ActivationCode`, `CodeBatch`, `CodeUsage`, `Project` (lié au code ou au client), `UploadedImage` (privée, avec durée de conservation), `Generation` (paramètres, version du moteur, graine, empreinte, statut, métriques), `Variant`, `ThreadSequence` (JSON compact ou binaire), `BoardGeometry` (version), `AssemblyProgress` (étape et appareil), `Order`, `Payment`, `Shipment`, `Market`.

## 8. Commerce : décision à prendre

| Option | Pour | Contre |
|---|---|---|
| **A. Tout sur mesure** (Next.js + PostgreSQL) | Un seul système ; paiement à la livraison, transporteurs algériens et codes intégrés nativement ; arabe et RTL maîtrisés | Plus de développement (panier, checkout, taxes) |
| **B. Shopify pour l'international, sur mesure pour l'Algérie** | Mise en ligne Europe rapide, checkout éprouvé | Deux systèmes, synchronisation des codes, abonnement Shopify, paiement à la livraison algérien mal supporté |
| C. Shopify partout | Le plus rapide | Algérie mal couverte (paiement à la livraison, Yalidine, dinar) |

**Recommandation : option A.** Le catalogue tient en un produit, donc le e-commerce sur mesure reste léger. Le cœur du marché algérien (paiement à la livraison, confirmation, transporteurs) n'est bien servi que par du sur-mesure.

## 9. Hébergement

- Services déployables séparément : web, moteur avec worker, base, stockage.
- **Point juridique à vérifier** : la loi 18-05 sur le e-commerce en Algérie pourrait imposer un hébergement local (voir `08`). L'architecture conteneurisée (Docker) permet de déployer en Algérie et/ou en Europe.
- Les coûts sont faibles au lancement : une génération ne prend que quelques secondes de CPU.

## 10. Sécurité
- Photos privées et URLs signées de courte durée.
- Suppression automatique (par exemple 30 jours après validation, à décider).
- Aucune photo dans les logs.
- Rôles pour le back-office.
- Webhooks de paiement vérifiés.
- Limitation de débit sur l'activation et l'import.
- Validation des fichiers : type réel, taille de 15 Mo maximum, dimensions minimales.
