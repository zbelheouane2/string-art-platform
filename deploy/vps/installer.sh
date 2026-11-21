#!/usr/bin/env bash
# Installation complète du site DeeKra sur un serveur VPS neuf (Ubuntu 24.04 LTS), en root :
#
#   curl -fsSL https://raw.githubusercontent.com/zbelheouane2/string-art-platform/main/deploy/vps/installer.sh -o installer.sh
#   bash installer.sh
#
# Ce que fait le script (on peut le relancer sans risque, il reprend là où il en est) :
#   1. mises à jour de sécurité automatiques, mémoire d'appoint (swap), pare-feu, protection SSH ;
#   2. Docker, puis le code du site dans /opt/deekra ;
#   3. fichier de réglages /opt/deekra/deploy/.env avec des mots de passe tirés au hasard ;
#   4. construction du site et du moteur, base PostgreSQL, HTTPS Let's Encrypt (Caddy), HSTS ;
#   5. démarrage automatique au redémarrage du serveur, sauvegarde de la base chaque nuit ;
#   6. sur demande, copie des données de l'ancienne base (commandes, codes, prix, tarifs).
#
# Variables facultatives (sinon les questions sont posées à l'écran) :
#   DOMAIN, ADMIN_PASSWORD, BRANCH (main par défaut), OLD_DATABASE_URL, REPO_URL
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/zbelheouane2/string-art-platform.git}"
BRANCH="${BRANCH:-main}"
DEEKRA_DIR="${DEEKRA_DIR:-/opt/deekra}"
ENV_FILE="$DEEKRA_DIR/deploy/.env"
SWAP_SIZE="${SWAP_SIZE:-4G}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

info() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    ! %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*" >&2; exit 1; }
ask() { local v; read -r -p "$1" v </dev/tty; printf '%s' "$v"; }
ask_secret() { local v; read -r -s -p "$1" v </dev/tty; echo >&2; printf '%s' "$v"; }
rand() { openssl rand -hex 24; }

[ "$(id -u)" -eq 0 ] || die "se connecter en root (ou taper : sudo -i), puis relancer."
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || die "ce script est prévu pour Ubuntu 24.04 LTS (système trouvé : ${PRETTY_NAME:-inconnu})."
[ "${VERSION_ID:-}" = "24.04" ] || warn "Ubuntu ${VERSION_ID:-?} : le script est testé pour 24.04, on continue."

public_ip() { curl -4 -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}'; }

# --- 1. Système -------------------------------------------------------------------------------
info "Mise à jour du système"
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
apt-get update -q
apt-get -yq -o Dpkg::Options::=--force-confold upgrade
apt-get install -yq ca-certificates curl git openssl ufw fail2ban unattended-upgrades dnsutils
dpkg-reconfigure -f noninteractive unattended-upgrades
ok "mises à jour de sécurité automatiques activées"

timedatectl set-timezone Africa/Algiers 2>/dev/null || true

if ! swapon --show | grep -q .; then
  info "Mémoire d'appoint (swap $SWAP_SIZE) : la construction du site a besoin de plus de 2 Go"
  fallocate -l "$SWAP_SIZE" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/90-deekra-swap.conf
fi
ok "swap : $(swapon --show --noheadings | awk '{print $3}' | head -1)"

info "Pare-feu : seuls SSH (22), http (80) et https (443) sont ouverts"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
# Port SSH de la connexion en cours (si l'hébergeur en utilise un autre que 22), pour ne pas se bloquer.
SSH_PORT="$(echo "${SSH_CONNECTION:-}" | awk '{print $4}')"
[ -n "$SSH_PORT" ] && ufw allow "$SSH_PORT/tcp" >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null
ok "pare-feu actif"
# La base et le moteur ne publient aucun port : Docker ne les expose pas à Internet.

cat > /etc/fail2ban/jail.d/deekra.local <<'JAIL'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
JAIL
systemctl enable --now fail2ban >/dev/null 2>&1 && systemctl restart fail2ban
ok "protection SSH contre les essais de mot de passe (fail2ban)"

# --- 2. Docker et code -----------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  info "Installation de Docker"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null
# Limite la taille des journaux des conteneurs (sinon le disque se remplit avec le temps).
if [ ! -f /etc/docker/daemon.json ]; then
  echo '{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}' > /etc/docker/daemon.json
  systemctl restart docker
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ,) (démarre seul avec le serveur)"

info "Code du site ($BRANCH)"
if [ -d "$DEEKRA_DIR/.git" ]; then
  git -C "$DEEKRA_DIR" fetch -q origin "$BRANCH"
  git -C "$DEEKRA_DIR" checkout -q "$BRANCH"
  git -C "$DEEKRA_DIR" merge -q --ff-only "origin/$BRANCH"
else
  git clone -q --branch "$BRANCH" "$REPO_URL" "$DEEKRA_DIR"
fi
ok "$(git -C "$DEEKRA_DIR" log -1 --format='%h %s' | cut -c1-80)"

. "$DEEKRA_DIR/deploy/vps/commun.sh"

# --- 3. Réglages -----------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  info "Réglages du site"
  IP="$(public_ip)"
  if [ -z "${DOMAIN:-}" ]; then
    echo "Nom de domaine du site, sans https:// ni www (ex. deekra.dz)."
    echo "Pas encore de domaine ? Appuyer sur Entrée : le site sera sur ${IP//./-}.sslip.io (adresse provisoire)."
    DOMAIN="$(ask 'Domaine : ')"
  fi
  DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%%/*}"
  [ -n "$DOMAIN" ] || DOMAIN="${IP//./-}.sslip.io"

  while [ "${#ADMIN_PASSWORD}" -lt 10 ] || [[ "$ADMIN_PASSWORD" == *"'"* ]]; do
    ADMIN_PASSWORD="$(ask_secret "Mot de passe de /admin (10 caractères minimum, sans apostrophe ; rien ne s'affiche) : ")"
  done

  umask 077
  cat > "$ENV_FILE" <<ENV
# Réglages du site DeeKra sur ce serveur. Ne jamais envoyer ce fichier ni le copier ailleurs.
# Après une modification : bash /opt/deekra/deploy/vps/mettre-a-jour.sh
DOMAIN=$DOMAIN
POSTGRES_VERSION=17
POSTGRES_PASSWORD=$(rand)
ENGINE_TOKEN=$(rand)
SESSION_SECRET=$(rand)
ADMIN_PASSWORD='$ADMIN_PASSWORD'

# Google Sheet des commandes (docs/commandes-google-sheet.md). Vide = pas d'envoi.
ORDER_SHEET_URL=
ORDER_SHEET_SECRET=

# Réglages publics (visibles dans le navigateur, ce ne sont pas des secrets).
NEXT_PUBLIC_BRAND_NAME=DeeKra
NEXT_PUBLIC_ORDERING_OPEN=true
NEXT_PUBLIC_SUPPORT_EMAIL=deekraart@gmail.com
NEXT_PUBLIC_WHATSAPP=213771704033
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_TIKTOK_URL=
NEXT_PUBLIC_LEGAL_ANPDP=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=2653054011829833
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
ENV
  chmod 600 "$ENV_FILE"
  ok "réglages enregistrés dans $ENV_FILE (mots de passe tirés au hasard)"
else
  ok "réglages existants conservés ($ENV_FILE)"
fi
DOMAIN="$(grep -E '^DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"

# Le certificat HTTPS ne peut être obtenu que si le domaine pointe déjà vers ce serveur.
IP="$(public_ip)"
DNS_IP="$(dig +short A "$DOMAIN" | tail -1)"
if [ "$DNS_IP" != "$IP" ]; then
  warn "$DOMAIN pointe vers « ${DNS_IP:-rien} » au lieu de $IP."
  warn "Le site démarre quand même ; le cadenas https arrivera seul quelques minutes après la correction du DNS."
fi

# --- 4. Construction et démarrage --------------------------------------------------------------
build_images
dc up -d db
wait_db

if [ -n "${OLD_DATABASE_URL:-}" ]; then
  MIGRATE=o
elif ! dc exec -T db psql -U deekra -d deekra -tAc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL" | grep -q t; then
  echo
  echo "Copier les données de l'ancien site (commandes, codes, prix, tarifs de livraison) ?"
  echo "Il faut l'adresse DATABASE_URL de l'ancien site (Render → deekra → Environment)."
  MIGRATE="$(ask 'Copier maintenant ? [o/N] : ')"
else
  MIGRATE=n
fi

if [[ "$MIGRATE" =~ ^[oOyY] ]]; then
  bash "$DEPLOY_DIR/vps/migrer-donnees.sh"
else
  migrate_db
fi
dc up -d

info "Vérification du site"
if wait_site; then ok "le site, la base et le moteur répondent"; else warn "le site ne répond pas encore : voir « docker compose logs web »"; fi

# --- 5. Sauvegardes ----------------------------------------------------------------------------
cat > /etc/cron.d/deekra-sauvegarde <<CRON
# Sauvegarde de la base DeeKra chaque nuit à 3 h (heure d'Alger), 14 jours conservés.
0 3 * * * root bash $DEPLOY_DIR/vps/sauvegarder.sh >> /var/log/deekra-sauvegarde.log 2>&1
CRON
chmod 644 /etc/cron.d/deekra-sauvegarde
bash "$DEPLOY_DIR/vps/sauvegarder.sh" >/dev/null && ok "sauvegarde chaque nuit à 3 h dans $BACKUP_DIR (une première vient d'être faite)"

cat <<FIN

──────────────────────────────────────────────────────────────
  Installation terminée.

  Site   : https://$DOMAIN
  Admin  : https://$DOMAIN/admin
  État   : https://$DOMAIN/api/health

  Mettre à jour le site : bash $DEPLOY_DIR/vps/mettre-a-jour.sh
  Recopier les données  : bash $DEPLOY_DIR/vps/migrer-donnees.sh
  Sauvegardes           : ls $BACKUP_DIR
──────────────────────────────────────────────────────────────
FIN
