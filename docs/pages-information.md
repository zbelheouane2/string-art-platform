# Pages d'information, engagements et contacts

_2026-11-16. Pages créées, non publiées : à relire et valider par le propriétaire avant la mise en ligne._

## Ce qui a été ajouté

| Élément | Où | Détail |
|---|---|---|
| Livraison | `/[langue]/livraison` | Zones, domicile ou bureau, délais indicatifs, frais par wilaya, appel de confirmation, paiement à la réception. |
| Retours et échanges | `/[langue]/retours` | Kit abîmé, incomplet ou non conforme : signalement sous 4 jours ouvrables, échange sans frais, remboursement sous 15 jours si échange impossible. Code défectueux, refus du colis, portrait déjà validé. |
| Protection des données personnelles | `/[langue]/confidentialite` | Rédigée selon la loi n° 18-07 du 10 juin 2018 : responsable, données collectées, finalités, consentement, destinataires, durée de conservation, droits (information, accès, rectification, opposition), ANPDP, cookies, sécurité. |
| Conditions générales de vente | `/[langue]/conditions` | Objet (loi n° 18-05), produit, prix, commande, paiement, livraison, garantie, photo, données, droit applicable. |
| Engagements | Fiche du kit, sous le bouton Commander | Délai de livraison, paiement à la réception, échange sans frais, question sur WhatsApp. |
| Pied de page | Toutes les pages | Liens vers les 4 pages ; WhatsApp ; e-mail et réseaux affichés seulement s'ils sont renseignés. |

## Réglages

- Délais (`apps/web/src/config/policies.ts`) : livraison 2 à 5 jours ouvrables, signalement 4 jours ouvrables, remboursement 15 jours, date de mise à jour des pages.
- Contacts et mentions légales (variables d'environnement, voir `.env.example`) : `NEXT_PUBLIC_WHATSAPP` (par défaut 213771704033), `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `NEXT_PUBLIC_LEGAL_COMPANY`, `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_LEGAL_RC`, `NEXT_PUBLIC_LEGAL_NIF`, `NEXT_PUBLIC_LEGAL_ANPDP`. Un champ vide n'apparaît pas.

## À valider avant publication

1. **Délais** : 2 à 5 jours ouvrables de livraison (à confirmer avec le transporteur).
2. **Garantie** : 4 jours ouvrables pour signaler un problème et 15 jours pour rembourser (repris de l'article 23 de la loi 18-05, à confirmer).
3. **Portrait validé non échangeable** : règle déduite du fonctionnement actuel du code.
4. **Identité du vendeur** : raison sociale, adresse, registre du commerce, NIF. Obligatoires (loi 18-05) avant d'ouvrir les ventes.
5. **Déclaration ANPDP** : la loi 18-07 impose une déclaration (ou une autorisation) préalable auprès de l'Autorité nationale avant tout traitement de données personnelles. Indiquer le numéro de récépissé une fois obtenu.
6. **Transfert hors d'Algérie** : les commandes sont envoyées vers une Google Sheet, donc hébergées hors d'Algérie. La loi 18-07 soumet ce transfert à l'autorisation de l'ANPDP. À traiter avant l'ouverture (autorisation, ou outil hébergé en Algérie).
7. **Relecture juridique** des quatre pages par un juriste algérien, en particulier les traductions arabes.
