# Mettre le site en ligne gratuitement sur Oracle Cloud

Oracle Cloud « Always Free » prête gratuitement un vrai serveur (processeur ARM Ampere A1) : site, base de données et calcul des portraits tournent dessus, sans mise en veille.

**Règle d'or : rester sur les ressources « Always Free ».** Ne jamais cliquer sur « Upgrade to Pay As You Go » (passage au paiement à l'usage) : au-delà des limites gratuites, Oracle facturerait la carte.

Limites gratuites (documentation Oracle, juin 2026) : 2 cœurs ARM et 12 Go de mémoire au total, 200 Go de disque, dans la « région d'origine » choisie à l'inscription.

## 1. Créer le compte (15 minutes)

1. Aller sur `oracle.com/cloud/free` puis « Start for free ».
2. Pays : Algérie. Nom, e-mail, mot de passe.
3. **Région d'origine (Home Region)** : choisir **France Central (Marseille)** ou **Spain Central (Madrid)**, les plus proches de l'Algérie. Ce choix est définitif : le serveur gratuit ne peut exister que dans cette région.
4. Carte bancaire : Oracle demande une carte **Visa ou Mastercard internationale** pour vérifier l'identité (un petit montant est bloqué puis rendu). Les cartes CIB et Edahabia ne passent pas. Une carte internationale d'une banque algérienne, une carte d'un proche à l'étranger ou une carte virtuelle internationale peuvent fonctionner. Aucun paiement n'est prélevé tant qu'on reste en « Always Free ».

## 2. Créer le serveur (10 minutes)

Menu ☰ → **Compute** → **Instances** → **Create instance**.

1. Nom : `deekra`.
2. **Image** : « Change image » → **Canonical Ubuntu 24.04** (pas la version « Minimal »).
3. **Shape** : « Change shape » → **Ampere** → **VM.Standard.A1.Flex** → **2 OCPU** et **12 Go** de mémoire. Le badge « Always Free-eligible » doit être affiché.
4. **Clés SSH** : « Generate a key pair for me » → **Save private key**. Gardez ce fichier précieusement : c'est la clé du serveur (sans elle, plus d'accès).
5. **Disque de démarrage** : laisser la taille par défaut (environ 50 Go, gratuit).
6. **Create**. Après 1 à 2 minutes, noter l'**adresse IP publique** affichée.

**Message « Out of capacity » (plus de place) :** c'est fréquent, les serveurs gratuits sont très demandés. Solutions, dans l'ordre :
- réessayer plus tard, de préférence tôt le matin ou tard le soir ;
- essayer une taille plus petite : **1 OCPU et 6 Go** (suffisant pour démarrer) ;
- si la page propose plusieurs « Availability domains », en essayer un autre.

## 3. Ouvrir le site vers Internet (5 minutes)

Sur la page du serveur : cliquer sur le **Subnet** → **Security Lists** → la liste par défaut → **Add Ingress Rules**, puis ajouter deux règles :

| Source CIDR | Protocole | Port de destination |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

## 4. Nom de domaine (10 minutes)

Le site a besoin d'un nom pour obtenir le cadenas HTTPS.

- **Si vous avez un nom de domaine** (ex. `deekra.com` ou `deekra.dz`) : chez le vendeur du nom, créer deux enregistrements **A** : `@` et `www`, tous deux vers l'adresse IP du serveur.
- **Pour démarrer sans rien acheter** : créer une adresse gratuite sur `duckdns.org` (ex. `deekra.duckdns.org`) et y saisir l'adresse IP du serveur. Vous pourrez passer à un vrai nom plus tard.

## 5. Installer le site (30 minutes, surtout de l'attente)

Sur l'ordinateur (Windows : ouvrir **PowerShell** ; Mac : **Terminal**), dans le dossier qui contient la clé et le zip :

```bash
scp -i ssh-key.key deekra-site-complet.zip ubuntu@ADRESSE_IP:
ssh -i ssh-key.key ubuntu@ADRESSE_IP
```

(Sur Mac, si la clé est refusée : `chmod 600 ssh-key.key`.)

Une fois connecté au serveur, copier-coller ces lignes une par une :

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
sudo apt install -y unzip && unzip deekra-site-complet.zip && cd deekra/deploy
cp .env.prod.example .env
nano .env
```

Dans `nano`, remplir :
- `DOMAIN=` votre nom (ex. `deekra.duckdns.org`, sans `https://`) ;
- `POSTGRES_PASSWORD=`, `ENGINE_TOKEN=`, `SESSION_SECRET=` : trois mots de passe différents, obtenus avec `openssl rand -hex 24` ;
- `ADMIN_PASSWORD=` : votre mot de passe pour `/admin` ;
- **enlever le `#`** devant `COMPOSE_PROFILES=oracle` et `KEEPALIVE_MB=3000` (voir l'étape 6). Avec un serveur de 6 Go, mettre `KEEPALIVE_MB=1500`.

Enregistrer : `Ctrl+O`, `Entrée`, puis quitter : `Ctrl+X`. Ensuite :

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.prod.yml run --rm migrate
```

La première commande prend 10 à 20 minutes. Ouvrir ensuite `https://votre-domaine/api/health` : « ok » pour la base et pour le moteur, puis `/admin`.

## 6. Empêcher Oracle de reprendre le serveur

Oracle peut récupérer un serveur gratuit jugé **inactif pendant 7 jours** : processeur, réseau **et** mémoire tous sous 20 %. Une petite boutique est presque toujours sous ces seuils. Le réglage `COMPOSE_PROFILES=oracle` de l'étape 5 lance un petit service qui **réserve de la mémoire** (3 Go sur 12, soit plus de 20 % avec le site), sans consommer de processeur. Le serveur n'est donc jamais considéré comme inactif. Ne pas le désactiver.

Vérification : `sudo docker stats --no-stream` doit montrer `deekra-keepalive-1` avec environ 3 Go.

## 7. Après la mise en ligne

- **Mises à jour** : envoyer le nouveau zip (`scp`, comme à l'étape 5), puis sur le serveur : `unzip -o deekra-site-complet.zip && cd deekra/deploy` et relancer les deux commandes `sudo docker compose` de l'étape 5. Le fichier `.env` est conservé.
- **Sauvegarde quotidienne de la base** : voir `docs/hebergement.md`, section « Sauvegarde ».
- **Redémarrage du serveur** : le site redémarre tout seul.
