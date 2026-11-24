# Recevoir les commandes dans une Google Sheet

Chaque commande validée sur le site est enregistrée en base **et** ajoutée comme
une ligne dans votre Google Sheet. Aucun compte développeur Google n'est nécessaire.

## Mise en place (depuis l'admin, 10 minutes, une seule fois)

Tout se fait dans **Admin → Réglages → Google Sheets** : la page affiche le
script à copier (avec le mot secret déjà inclus), les étapes, le bouton
« Tester la liaison » et l'état des envois.

1. Créez une Google Sheet (par exemple « Commandes DeeKra »).
2. Menu **Extensions → Apps Script**. Effacez le contenu et collez le script copié depuis l'admin.
3. Enregistrez le script.
4. **Déployer → Nouveau déploiement → Application Web**.
   Exécuter en tant que : *Moi*. Qui a accès : *Tout le monde*. Autorisez l'accès demandé.
5. Copiez l'URL de l'application Web (`https://script.google.com/macros/s/…/exec`), collez-la dans l'admin,
   cochez « Envoyer chaque nouvelle commande », enregistrez, puis « Tester la liaison ».

Le script (version 2, `src/lib/notify/sheetScript.ts`) reçoit trois messages, tous protégés par le mot secret :
`order` (nouvelle ligne), `status` (met à jour la colonne « Statut » si l'option est cochée) et `test`
(vérifie la liaison sans rien écrire). Colonnes : Commande, Date, Nom, Téléphone, Wilaya, Commune, Livraison,
Paiement, Quantité, Options, Code promo, Remise, Frais de livraison, Total, Devise, Remarque, Langue, Cadeau,
Acheteur, Tél. acheteur, E-mail acheteur, Message cadeau, Statut. Une ancienne feuille (script version 1) doit
recevoir les colonnes « Code promo » et « Remise » après « Options », puis le nouveau script.

Si l'envoi échoue (Google indisponible), la commande reste enregistrée en base, l'échec est noté dans le
journal (`order.created`, `sheet: "failed"`) et le bouton « Envoyer les commandes manquantes » la renverra.

## Ancien réglage par variables

Sans réglage dans l'admin, le site utilise encore :

```
ORDER_SHEET_URL=https://script.google.com/macros/s/…/exec
ORDER_SHEET_SECRET=le-même-mot-secret
```
