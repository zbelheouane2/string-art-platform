# shellcheck shell=bash
# Fonctions partagées par les scripts du serveur VPS (chargé avec « . commun.sh »).
set -euo pipefail

DEEKRA_DIR="${DEEKRA_DIR:-/opt/deekra}"
DEPLOY_DIR="$DEEKRA_DIR/deploy"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/deekra}"
# Version de PostgreSQL utilisée pour lire une autre base (doit être >= à celle de la base lue).
PG_CLIENT_IMAGE="${PG_CLIENT_IMAGE:-postgres:17}"

info() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    ! %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERREUR : %s\033[0m\n' "$*" >&2; exit 1; }

need_root() { [ "$(id -u)" -eq 0 ] || die "lancer ce script en root (sudo -i)."; }

dc() { docker compose -f "$DEPLOY_DIR/docker-compose.prod.yml" --project-directory "$DEPLOY_DIR" "$@"; }

wait_db() {
  local _
  for _ in $(seq 1 60); do
    if dc exec -T db pg_isready -U deekra -d deekra >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  die "la base de données ne démarre pas (voir : docker compose logs db)."
}

wait_site() {
  local _
  for _ in $(seq 1 60); do
    if dc exec -T web node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}

# Construit les images une par une : avec 2 Go de mémoire, construire tout en parallèle échoue.
build_images() {
  info "Construction du moteur des portraits"
  dc build engine
  info "Construction du site (10 à 25 minutes sur 1 cœur, c'est normal)"
  dc build web
  dc --profile outils build migrate
}

migrate_db() {
  info "Mise à jour des tables et données de départ (sans effacer les réglages ni les commandes)"
  dc --profile outils run --rm migrate
}
