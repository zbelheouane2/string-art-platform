# Recevoir les commandes dans une Google Sheet

Chaque commande validée sur le site est enregistrée en base **et** ajoutée comme
une ligne dans votre Google Sheet. Aucun compte développeur Google n'est nécessaire.

## Mise en place (10 minutes, une seule fois)

1. Créez une Google Sheet (par exemple « Commandes DeeKra »).
2. Menu **Extensions → Apps Script**. Effacez le contenu et collez le script ci-dessous.
3. Remplacez `CHANGEZ-MOI` par un mot secret long (le même que `ORDER_SHEET_SECRET` côté site).
4. **Déployer → Nouveau déploiement → Application Web**.
   Exécuter en tant que : *Moi*. Qui a accès : *Tout le monde*. Autorisez l'accès demandé.
5. Copiez l'URL de l'application Web (`https://script.google.com/macros/s/…/exec`) :
   c'est `ORDER_SHEET_URL` côté site.

Le mot secret empêche quelqu'un qui connaîtrait l'URL d'ajouter de fausses lignes.

```javascript
const SECRET = "CHANGEZ-MOI";
const COLUMNS = ["number", "createdAt", "fullName", "phone", "wilaya", "commune",
  "delivery", "payment", "quantity", "deliveryFee", "total", "currency", "note", "locale"];
const HEADERS = ["Commande", "Date", "Nom", "Téléphone", "Wilaya", "Commune",
  "Livraison", "Paiement", "Quantité", "Frais de livraison", "Total", "Devise", "Remarque", "Langue", "Statut"];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.secret !== SECRET) return json({ ok: false, error: "secret" });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const o = data.order;
  // Téléphone en texte pour garder le 0 initial ; frais vides = à confirmer par téléphone.
  sheet.appendRow(COLUMNS.map((k) => (k === "phone" ? "'" + o[k] : o[k] ?? "")).concat(["À confirmer"]));
  return json({ ok: true });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

## Côté site

```
ORDER_SHEET_URL=https://script.google.com/macros/s/…/exec
ORDER_SHEET_SECRET=le-même-mot-secret
```

Si l'envoi échoue (Google indisponible), la commande reste enregistrée en base
et l'échec est noté dans le journal (`order.created`, `sheet: "failed"`).
