# Mettre le site en ligne gratuitement : Render + Supabase

- **Supabase** garde la base de données (commandes, codes, tarifs, prix). Gratuit : 500 Mo.
- **Render** fait tourner le site et le moteur des portraits, réunis en un seul service gratuit.
- **UptimeRobot** visite le site toutes les 10 minutes pour qu'il ne s'endorme jamais (gratuit).

Aucune carte bancaire n'est demandée. Il suffit d'un compte GitHub (celui du projet) et d'une adresse e-mail. Durée : environ 45 minutes, dont 15 d'attente.

## 1. La base de données : Supabase (10 minutes)

1. Aller sur `supabase.com`, cliquer sur **Start your project** puis **Continue with GitHub**.
2. **New project** :
   - Name : `deekra` ;
   - Database Password : cliquer sur **Generate a password**, puis **copier ce mot de passe** dans une note (vous en aurez besoin à l'étape 4) ;
   - Region : **Central EU (Frankfurt)** ;
   - **Create new project**, puis attendre 2 minutes.
3. En haut de la page du projet, cliquer sur **Connect**.
4. Cliquer sur l'onglet **Direct (Connection string)**, puis, dans la liste **Method**, choisir **Session pooler** (pas « Direct connection »). Copier l'adresse affichée, qui commence par `postgresql://postgres.` et contient `pooler.supabase.com:5432`.
5. Dans cette adresse, remplacer `[YOUR-PASSWORD]` par le mot de passe noté à l'étape 2. Gardez cette adresse complète : c'est la **DATABASE_URL**.

## 2. Le site : Render (15 minutes, puis 10 à 15 minutes d'attente)

1. Aller sur `render.com`, cliquer sur **Get Started**, puis **GitHub**, et autoriser Render.
2. Pour l'accès aux dépôts, choisir **Only select repositories**, puis `string-art-platform`.
3. Dans Render : **New +** → **Blueprint**.
4. Choisir le dépôt `string-art-platform`. Pour **Branch**, choisir `claude/project-thread-tfxf8n` (la branche qui contient la version actuelle du site).
5. Render lit le fichier `render.yaml` et affiche le service **deekra** (offre **Free**). Remplir les cases demandées :
   - **DATABASE_URL** : l'adresse Supabase complète (étape 1.5) ;
   - **ADMIN_PASSWORD** : votre mot de passe pour l'espace `/admin` (10 caractères minimum) ;
   - **PUBLIC_BASE_URL** : laisser vide pour l'instant ;
   - **ORDER_SHEET_URL** et **ORDER_SHEET_SECRET** : l'adresse et le secret de la Google Sheet des commandes, ou vide.
   - `ENGINE_TOKEN` et `SESSION_SECRET` sont créés automatiquement par Render : n'y touchez pas.
6. **Apply** (ou **Deploy Blueprint**). La première construction prend 10 à 15 minutes. À la fin, le service affiche **Live**, avec une adresse du type `https://deekra.onrender.com`.
7. Revenir dans **Environment**, mettre cette adresse dans **PUBLIC_BASE_URL**, puis enregistrer (**Save, rebuild and deploy**).

Vérification : ouvrir `https://deekra.onrender.com/api/health`. La page doit afficher `"database":"ok"` et `"engine":{"status":"ok"`.

## 3. Empêcher le site de s'endormir : UptimeRobot (5 minutes)

L'offre gratuite de Render endort le site après 15 minutes sans visite (le visiteur suivant attendrait environ 1 minute). Une visite automatique toutes les 10 minutes l'en empêche. Le service reste ainsi allumé tout le mois sans dépasser les 750 heures gratuites (un mois compte au plus 744 heures), et la base Supabase reste active.

1. Aller sur `uptimerobot.com` et créer un compte gratuit.
2. **New monitor** :
   - Monitor type : **HTTP(s)** ;
   - URL : `https://deekra.onrender.com/api/health` ;
   - Monitoring interval : **5 minutes** (le plus court en gratuit), ou 10 minutes ;
   - **Create monitor**.
3. Bonus : UptimeRobot vous envoie un e-mail si le site tombe en panne.

## 4. Premiers réglages (10 minutes)

1. Ouvrir `https://deekra.onrender.com/admin` et se connecter avec ADMIN_PASSWORD.
2. **Prix et options** : vérifier les prix.
3. **Livraison** : importer ou saisir les tarifs de ZR Express.
4. **Codes d'activation** : créer un lot (par exemple 100 codes), puis **Télécharger** le fichier pour l'imprimeur.
5. Faire une commande de test sur le site, puis l'annuler dans **Commandes**.

## 5. Nom de domaine (facultatif, plus tard)

Render → service **deekra** → **Settings** → **Custom Domains** → **Add Custom Domain** (ex. `deekra.com`). Render indique les enregistrements à créer chez le vendeur du nom. Le cadenas HTTPS est fourni gratuitement. Mettre ensuite la nouvelle adresse dans **PUBLIC_BASE_URL**.

## Mises à jour du site

Chaque nouvelle version envoyée sur la branche du projet est mise en ligne automatiquement par Render, en 10 minutes environ. La base est mise à jour toute seule au démarrage, sans effacer les prix, les tarifs ni les commandes.

## Limites de l'offre gratuite

- Mémoire : 512 Mo. Le site et le calcul d'un portrait tiennent dedans, mais deux calculs lancés exactement en même temps peuvent ralentir le site. Le jour où les ventes augmentent, passer à l'offre **Starter** de Render (environ 7 $ par mois) depuis **Settings** → **Instance Type**, sans rien réinstaller.
- Base Supabase : 500 Mo, de quoi stocker des dizaines de milliers de commandes. Pas de sauvegarde automatique en gratuit : exporter régulièrement les commandes depuis l'admin.
