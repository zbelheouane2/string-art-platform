# Espace admin

Adresse : `/admin` (en français, hors moteurs de recherche).

## Connexion et comptes

- **Propriétaire** : identifiant `admin` (ou vide) et le mot de passe `ADMIN_PASSWORD` du serveur. Toujours administrateur, ne peut pas être supprimé depuis l'admin.
- **Comptes nominatifs** (Réglages → Comptes) : identifiant, mot de passe (10 caractères au moins, stocké en empreinte scrypt), rôle.
- Session : cookie signé (`SESSION_SECRET`), 12 h. Un compte désactivé, changé de rôle ou de mot de passe perd ses sessions ouvertes.
- 5 essais ratés par quart d'heure et par appareil.

## Rôles (`src/lib/admin/permissions.ts`)

| Rubrique | Administrateur | Employé |
|---|---|---|
| Tableau de bord | complet | sans chiffre d'affaires |
| Commandes (voir, confirmer, changer l'état) | ✓ | ✓ |
| Stock et ruptures | ✓ | ✓ |
| Avis clients | ✓ | ✓ |
| Annonce, FAQ | ✓ | ✓ |
| Export Excel des commandes, clients, statistiques | ✓ | — |
| Prix, codes promo, livraison, codes d'activation | ✓ | — |
| Textes, photos, contacts, référencement | ✓ | — |
| Comptes, Google Sheets, journal | ✓ | — |

## Où sont les données

| Réglage | Stockage |
|---|---|
| Annonce, contacts, Google Sheets, photos remplacées, référencement, FAQ ajoutée | table `Setting` (JSON par clé, `src/lib/settings.ts`, repli sur les valeurs par défaut si la base ne répond pas) |
| Textes modifiés | table `ContentOverride` (langue + clé), appliqués par-dessus `messages/<langue>.json` |
| Images téléversées | table `MediaAsset`, servies par `/media/<id>` (cache 1 an) |
| Exemples avant/après | table `ShowcaseExample` |
| Avis | table `CustomerReview` |
| Stock | `Product.stockQuantity`, `Product.soldOut` |

Toutes les opérations sont notées dans `AuditLog` (acteur `admin` ou `admin:<identifiant>`), visibles dans Réglages → Journal.
