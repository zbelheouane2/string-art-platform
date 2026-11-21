#!/usr/bin/env bash
# Met le site à jour avec la dernière version du code (et applique un .env modifié).
#   bash /opt/deekra/deploy/vps/mettre-a-jour.sh
# Les commandes, prix, tarifs et réglages sont conservés. Une sauvegarde est faite avant.
. "$(dirname "$(readlink -f "$0")")/commun.sh"
need_root

branch="$(git -C "$DEEKRA_DIR" rev-parse --abbrev-ref HEAD)"
info "Récupération de la dernière version ($branch)"
git -C "$DEEKRA_DIR" fetch -q origin "$branch"
git -C "$DEEKRA_DIR" merge -q --ff-only "origin/$branch"
ok "$(git -C "$DEEKRA_DIR" log -1 --format='%h %s' | cut -c1-80)"

info "Sauvegarde avant mise à jour"
bash "$DEPLOY_DIR/vps/sauvegarder.sh"

build_images
migrate_db
dc up -d --remove-orphans
if wait_site; then ok "site à jour et en ligne"; else warn "le site ne répond pas : voir « docker compose logs web »"; fi
docker image prune -f >/dev/null
