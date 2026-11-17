# Mettre le site en ligne

Ce dossier contient tout le site DeeKra : le site web (`apps/web`) et le moteur qui calcule les portraits (`services/engine`). Il faut trois éléments chez l'hébergeur :

| Élément | Dossier | Ce qu'il fait |
|---|---|---|
| Base de données PostgreSQL 16 | (fournie par l'hébergeur) | Commandes, codes, tarifs de livraison, prix |
| Moteur | `services/engine` (Dockerfile fourni) | Calcule le portrait en fil à partir de la photo |
| Site | `apps/web` (Dockerfile fourni) | Boutique, générateur, guide vocal, admin |

Les deux Dockerfile sont prêts : la plupart des hébergeurs (Railway, Render, un serveur VPS avec Docker) savent les utiliser directement.

## Gratuit, conseillé : Render + Supabase

Guide complet : `docs/hebergement-render.md` (un seul service : site + moteur, `Dockerfile.render`, `render.yaml`).

## Gratuit : Oracle Cloud « Always Free »

Guide complet : `docs/hebergement-oracle.md`.

## Serveur VPS payant (ex. Octenium VPS 2)

Un hébergement mutualisé avec cPanel ne convient pas : il ne fournit pas PostgreSQL et ne permet pas de faire tourner le moteur des portraits en continu. Il faut un **serveur VPS Linux** avec un accès root. Prévoir **2 cœurs et 4 Go de mémoire au minimum** (avec 2 Go, la construction du site manque de mémoire).

Tout est prêt dans le dossier `deploy/` : base, moteur, site et HTTPS automatique (certificat gratuit), en une seule commande.

1. Commander le VPS avec **Ubuntu 24.04**. Noter son adresse IP et le mot de passe root.
2. Chez le registraire du nom de domaine, créer deux enregistrements **A** : `@` et `www`, vers l'adresse IP du VPS.
3. Se connecter au serveur (`ssh root@ADRESSE_IP`) et installer Docker :
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
4. Envoyer le fichier zip du site sur le serveur (par exemple avec FileZilla en SFTP), puis :
   ```bash
   apt install -y unzip && unzip deekra-site-complet.zip && cd deekra/deploy
   cp .env.prod.example .env && nano .env      # remplir le domaine et les mots de passe
   ```
   Pour inventer un mot de passe : `openssl rand -hex 24`.
5. Lancer le site (10 à 15 minutes la première fois) :
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml run --rm migrate    # tables et données de départ
   ```
6. Ouvrir `https://votre-domaine/api/health`, puis `/admin`.

Mise à jour : envoyer le nouveau zip, le décompresser au même endroit (le fichier `.env` est conservé), puis relancer les deux commandes de l'étape 5.

Sauvegarde de la base (à programmer chaque jour) :
```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U deekra deekra | gzip > sauvegarde-$(date +%F).sql.gz
```

## Autre hébergeur (Railway, Render…)

## 1. Créer la base de données

Créez une base PostgreSQL 16 chez l'hébergeur et copiez son adresse de connexion (elle commence par `postgresql://`). C'est la variable `DATABASE_URL`.

## 2. Mettre en ligne le moteur

- Dossier à déployer : `services/engine`.
- Variable à définir : `ENGINE_TOKEN` = un mot de passe long, inventé (au moins 32 caractères).
- Port : 8000.
- Le moteur n'a pas besoin d'être public : s'il est sur le même hébergeur que le site, utilisez son adresse interne.

## 3. Mettre en ligne le site

- Dossier à déployer : `apps/web`.
- Port : 3000.
- Variables (voir le tableau plus bas).

## 4. Préparer la base (une seule fois, puis après chaque mise à jour)

Depuis un ordinateur avec Node 22, dans `apps/web` :

```bash
npm install
DATABASE_URL="postgresql://..." npm run db:migrate   # crée ou met à jour les tables
DATABASE_URL="postgresql://..." npm run db:seed      # première fois seulement : marchés, produits, prix du kit, paiement et livraison
```

Ensuite, créez les codes d'activation des kits : `DATABASE_URL="postgresql://..." npm run codes:create -- --count 100 --batch lot-1 --out codes.csv`.

## Variables du site

Ne mettez jamais ces valeurs dans le code ni dans un fichier envoyé par e-mail : saisissez-les uniquement dans les réglages de l'hébergeur.

| Variable | Obligatoire | Valeur |
|---|---|---|
| `DATABASE_URL` | oui | Adresse de la base (étape 1) |
| `ENGINE_URL` | oui | Adresse du moteur, par exemple `http://engine:8000` |
| `ENGINE_TOKEN` | oui | Le même mot de passe que pour le moteur |
| `SESSION_SECRET` | oui | Un autre mot de passe long, inventé (au moins 32 caractères) |
| `ADMIN_PASSWORD` | oui pour l'admin | Mot de passe de `/admin`, 10 caractères minimum. Vide = admin fermé |
| `PUBLIC_BASE_URL` | conseillé | Adresse du site, par exemple `https://deekra.dz` |
| `NEXT_PUBLIC_BRAND_NAME` | non | `DeeKra` |
| `NEXT_PUBLIC_ORDERING_OPEN` | non | `true` pour ouvrir les commandes, `false` pour les fermer |
| `ORDER_SHEET_URL`, `ORDER_SHEET_SECRET` | non | Envoi des commandes vers la Google Sheet (`docs/commandes-google-sheet.md`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | non | E-mail de contact affiché |
| `NEXT_PUBLIC_WHATSAPP` | non | Numéro WhatsApp affiché, sans `+` ni espaces |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_TIKTOK_URL` | non | Réseaux sociaux. Vide = masqué |
| `NEXT_PUBLIC_LEGAL_ANPDP` | non | Numéro de récépissé ANPDP (loi 18-07). Vide = masqué |
| `DEFAULT_MARKET` | non | `DZ` par défaut |

Les variables qui commencent par `NEXT_PUBLIC_` sont lues au moment de la construction du site : après les avoir changées, relancez un déploiement.

## Après la mise en ligne

1. Ouvrez `https://votre-site/api/health` : la page doit indiquer que la base et le moteur répondent.
2. Connectez-vous à `/admin`, saisissez ou importez les tarifs de livraison, vérifiez les prix.
3. Passez une commande de test, puis supprimez-la ou annulez-la dans l'admin.

## Essai sur un ordinateur (Docker)

```bash
docker compose up --build        # http://localhost:3000
```
