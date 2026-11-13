# Parcours client : commande, code, portrait, guide vocal

_Phase « site fonctionnel », tranche 1 (2026-11-13)._

## Ce qui marche

| Étape | Page | Détail |
|---|---|---|
| Commander | `/[langue]/commander` | Paiement à la livraison. Nom, mobile algérien (05/06/07, +213 accepté), 69 wilayas, commune, adresse si livraison à domicile, 1 à 5 kits. Prix lu en base (table `Price`), jamais envoyé par le navigateur. |
| Confirmation | `/[langue]/commande/DK-XXXXXX` | Numéro et total, aucune donnée personnelle affichée. |
| Google Sheet | — | Chaque commande ajoutée à la feuille du propriétaire (`docs/commandes-google-sheet.md`). |
| Code | `/[langue]/activer` | Code `XXXX-XXXX` imprimé dans le kit. Clé de contrôle : une faute de frappe est signalée tout de suite. Anti force brute : 8 codes inconnus par appareil et par quart d'heure. Cookie signé, 30 jours, sans compte. |
| Portrait | `/[langue]/creer` | Photo → moteur → aperçu. 3 rendus (doux, équilibré, contrasté), fond éclairci ou gardé, 10 calculs par code. La photo n'est **pas stockée** : seule son empreinte reste. Valider le portrait passe le code à « utilisé ». |
| Guide vocal | `/[langue]/guide/<id>` | Annonce « Départ A 1, puis B 40 », puis chaque clou. Lecture automatique (3 à 20 s par fil), pause, précédent/suivant, répéter, « perdu ? reprendre au fil n° », écran maintenu allumé, avancement gardé sur l'appareil. Plan de la planche avec le fil en cours. Réservé à l'appareil qui a saisi le code. |
| Démo du guide | `/[langue]/guide/demo` | Portrait de démonstration, ouvert à tous. |

Ressaisir un code déjà utilisé (autre téléphone) rouvre directement le guide.

## Codes : création d'un lot pour l'imprimeur

```
cd apps/web
npm run codes:create -- --count 200 --batch 2026-11-A --out codes-2026-11-A.csv
```

## Extensions prévues (architecture déjà en place)

- **Paiement** : `src/lib/payments/` — un adaptateur par prestataire (`PaymentMethod.provider`).
  Seul le paiement à la livraison est branché. Le paiement en ligne (CIB/EDAHABIA, PayPal pour la diaspora) attend une autorisation.
- **Transporteurs** : `src/lib/shipping/` — un adaptateur par société (Yalidine, ZR Express, …), modes en base (`DeliveryMethod`).
  Aucun branché : il faut un compte marchand et ses clés.
- **Voix** : synthèse vocale du navigateur pour l'instant. Les voix arabes manquent sur certains téléphones (message affiché) ; des enregistrements audio (lettres + nombres 1–60, 3 langues) sont prévus en phase 4.

## Décisions en attente

- Frais de livraison par wilaya (affichés « confirmés par téléphone » en attendant).
- Premier transporteur à brancher.
- Durée de conservation des portraits calculés (la photo, elle, n'est pas conservée).
