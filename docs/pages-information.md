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
- Contacts et mentions légales (variables d'environnement, voir `.env.example`) : `NEXT_PUBLIC_WHATSAPP` (par défaut 213771704033), `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `NEXT_PUBLIC_LEGAL_ANPDP`. Un champ vide n'apparaît pas.

## Décisions du propriétaire (2026-11-16)

- Délai de livraison : **2 à 5 jours ouvrables**, validé.
- Garantie : **4 jours ouvrables** pour signaler un problème, **remboursement sous 15 jours**, validé.
- Identité du vendeur : **DeeKra, auto-entrepreneur, service commercial 0771 70 40 33** (téléphone et WhatsApp). Pas de registre du commerce ; adresse et numéros personnels volontairement non publiés.
- Google Sheet des commandes : **provisoire, réservée aux tests**.

## Reste à faire avant publication

1. **Mentions légales** : la loi 18-05 (art. 8 et 11) demande au vendeur en ligne d'être inscrit (registre du commerce ou, pour un auto-entrepreneur, registre national de l'auto-entrepreneur) et d'afficher son identification. À vérifier avec un juriste ou l'ANAE : quelles mentions un auto-entrepreneur doit publier au minimum.
2. **Déclaration ANPDP** : la loi 18-07 impose une déclaration (ou une autorisation) préalable auprès de l'Autorité nationale avant tout traitement de données personnelles. Indiquer le numéro de récépissé une fois obtenu.
3. **Stockage des commandes** : remplacer la Google Sheet (hébergée hors d'Algérie, réservée aux tests) avant d'ouvrir les ventes, ou obtenir l'autorisation de transfert de l'ANPDP.
4. **Portrait validé non échangeable** : règle déduite du fonctionnement actuel du code, à confirmer.
5. **Relecture juridique** des quatre pages par un juriste algérien, en particulier les traductions arabes.
