# Mettre le site sur le VPS Octenium (VPS Starter)

Le site, le moteur des portraits et la base de données tournent ensemble sur un serveur loué chez Octenium (1 cœur, 2 Go de mémoire, 150 Go de disque, environ 1 900 DA par mois). Le serveur ne s'endort jamais et la base ne s'efface pas.

Un script fait toute l'installation : mises à jour de sécurité, pare-feu, Docker, base PostgreSQL 17, site, moteur, certificat HTTPS gratuit (Let's Encrypt, renouvelé seul), redirection http → https, HSTS, redémarrage automatique, sauvegarde de la base chaque nuit et copie des données de l'ancien site.

Durée : environ 1 heure, dont 30 à 40 minutes d'attente pendant la construction.

## 1. Commander le serveur (10 minutes)

Chez Octenium, offre **VPS Starter**. À la commande :

| Question | Réponse |
|---|---|
| Système d'exploitation | **Ubuntu 24.04 LTS** (64 bits). Pas Debian, pas CentOS, pas Windows. |
| Panneau de contrôle | **Aucun** (pas de cPanel, Plesk ni Webmin : le script installe tout ce qu'il faut) |
| Durée | Au choix. Un paiement annuel revient souvent moins cher. |
| Nom d'hôte (hostname) | `deekra` |

Après le paiement, Octenium envoie un e-mail avec **l'adresse IP** du serveur (4 nombres, par ex. `41.111.22.33`) et **le mot de passe root**. Les garder dans une note privée.

## 2. Nom de domaine (facultatif pour commencer)

- **Vous avez un domaine** (par ex. `deekra.dz` ou `deekra.com`) : chez le vendeur du domaine, dans la zone DNS, créer deux enregistrements de type **A** vers l'adresse IP du serveur : un pour `@` et un pour `www`. Le changement prend de 5 minutes à quelques heures.
- **Pas encore de domaine** : rien à faire. Le site sera sur une adresse provisoire du type `41-111-22-33.sslip.io`, avec le cadenas https. On pourra passer au vrai domaine plus tard (voir la fin de ce guide).

## 3. Se connecter au serveur (5 minutes)

- **Sur téléphone** : installer l'application gratuite **Termius** (Android ou iPhone). « New host » : adresse = l'IP du serveur, utilisateur = `root`, mot de passe = celui de l'e-mail. Se connecter.
- **Sur ordinateur** : ouvrir « Terminal » (Mac) ou « PowerShell » (Windows) et taper `ssh root@ADRESSE_IP`, puis le mot de passe (rien ne s'affiche quand on le tape, c'est normal).

À la première connexion, répondre `yes` à la question sur l'empreinte du serveur.

## 4. Lancer l'installation (40 minutes, presque tout en attente)

Copier-coller ces deux lignes, puis Entrée :

```bash
curl -fsSL https://raw.githubusercontent.com/zbelheouane2/string-art-platform/main/deploy/vps/installer.sh -o installer.sh
bash installer.sh
```

Le script pose trois questions :

1. **Domaine** : taper le domaine sans `https://` ni `www` (ex. `deekra.dz`), ou juste Entrée pour l'adresse provisoire.
2. **Mot de passe de /admin** : au moins 10 caractères, sans apostrophe.
3. **Copier les données de l'ancien site ?** Taper `o`, puis coller l'adresse de l'ancienne base. Pour la trouver : Render → service **deekra** → **Environment** → valeur de **DATABASE_URL** (elle commence par `postgresql://`). Rien ne s'affiche quand on la colle, c'est normal.

La construction du site prend 15 à 25 minutes sur ce serveur. Si la connexion du téléphone se coupe, se reconnecter et relancer `bash installer.sh` : le script reprend sans rien casser.

À la fin, le script affiche l'adresse du site. Vérifier :

- `https://VOTRE-ADRESSE/api/health` affiche `"database":"ok"` et `"engine":{"status":"ok"` ;
- `https://VOTRE-ADRESSE/admin` : se connecter, vérifier les commandes, les prix et les tarifs de livraison.

## 5. Basculer de Render vers le VPS

1. Faire une commande de test sur le nouveau site, puis l'annuler dans l'admin.
2. Juste avant de faire connaître la nouvelle adresse, recopier les données pour avoir les toutes dernières commandes :
   ```bash
   bash /opt/deekra/deploy/vps/migrer-donnees.sh
   ```
3. Mettre la nouvelle adresse partout : profils Facebook et Instagram, WhatsApp Business, Google Sheet si besoin, et le **QR code** de la carte du kit (il pointe vers l'ancienne adresse et doit être refait).
4. Garder Render allumé une à deux semaines, le temps que tout le monde passe sur la nouvelle adresse, puis le supprimer (et l'alerte UptimeRobot).

## Au quotidien

| Besoin | Commande (une fois connecté au serveur) |
|---|---|
| Mettre le site à jour avec la dernière version | `bash /opt/deekra/deploy/vps/mettre-a-jour.sh` |
| Voir les sauvegardes | `bash /opt/deekra/deploy/vps/restaurer.sh` |
| Revenir à une sauvegarde | `bash /opt/deekra/deploy/vps/restaurer.sh /var/backups/deekra/deekra-AAAA-MM-JJ-HHMM.dump` |
| Faire une sauvegarde tout de suite | `bash /opt/deekra/deploy/vps/sauvegarder.sh` |
| Voir les messages du site en cas de problème | `cd /opt/deekra/deploy && docker compose -f docker-compose.prod.yml logs --tail 100 web` |
| Changer un réglage (mot de passe admin, Google Sheet, pixels…) | `nano /opt/deekra/deploy/.env`, enregistrer, puis lancer la mise à jour |

Les sauvegardes (chaque nuit à 3 h, 14 jours gardés) sont sur le serveur lui-même. Une fois par mois, en copier une sur un ordinateur, par exemple avec FileZilla (SFTP, mêmes identifiants que SSH, dossier `/var/backups/deekra`).

Le serveur installe seul les mises à jour de sécurité d'Ubuntu. Le site redémarre seul si le serveur redémarre.

## Passer de l'adresse provisoire au vrai domaine

1. Créer les deux enregistrements **A** (`@` et `www`) vers l'IP du serveur (étape 2) et attendre qu'ils soient actifs.
2. `nano /opt/deekra/deploy/.env` : remplacer la ligne `DOMAIN=…sslip.io` par `DOMAIN=deekra.dz` (votre domaine). Enregistrer (Ctrl+O, Entrée, Ctrl+X).
3. `bash /opt/deekra/deploy/vps/mettre-a-jour.sh`. Le cadenas https du nouveau domaine arrive seul en une minute.

## Détails techniques

- Code dans `/opt/deekra` (branche `main`), réglages dans `/opt/deekra/deploy/.env` (droits 600, mots de passe tirés au hasard par le script, jamais versionné).
- Services Docker (`deploy/docker-compose.prod.yml`) : `db` (PostgreSQL 17, aucun port ouvert vers l'extérieur), `engine` (moteur, interne), `web` (Next.js, interne), `caddy` (seul exposé, ports 80 et 443). Tous en `restart: unless-stopped` ; Docker est activé au démarrage (systemd).
- Caddy (`deploy/Caddyfile`) : certificat Let's Encrypt automatique (ZeroSSL en secours), redirection http → https, en-tête `Strict-Transport-Security: max-age=31536000`, compression.
- Pare-feu ufw : 22, 80, 443 ouverts, le reste fermé. fail2ban bloque une adresse après 5 mots de passe SSH faux. Mises à jour de sécurité automatiques (unattended-upgrades).
- Mémoire : 4 Go de swap ajoutés, nécessaires pour construire le site avec 2 Go. Les images sont construites l'une après l'autre.
- Migration (`migrer-donnees.sh`) : `pg_dump` du schéma `public` de l'ancienne base (lecture seule) avec le client PostgreSQL 17, puis `pg_restore` dans une base vide et `prisma migrate deploy`. L'adresse de l'ancienne base est saisie sans écho et n'est écrite nulle part.
- Sauvegardes (`sauvegarder.sh`, `/etc/cron.d/deekra-sauvegarde`) : `pg_dump -Fc` dans `/var/backups/deekra` (droits 700), 14 jours.
