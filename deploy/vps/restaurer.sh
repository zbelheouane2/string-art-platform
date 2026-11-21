#!/usr/bin/env bash
# Remet la base dans l'état d'une sauvegarde.
#   bash /opt/deekra/deploy/vps/restaurer.sh                     -> liste les sauvegardes
#   bash /opt/deekra/deploy/vps/restaurer.sh /var/backups/deekra/deekra-AAAA-MM-JJ-HHMM.dump
. "$(dirname "$(readlink -f "$0")")/commun.sh"
need_root

if [ $# -eq 0 ]; then
  echo "Sauvegardes disponibles :"
  ls -1t "$BACKUP_DIR"/deekra-*.dump 2>/dev/null || echo "  (aucune)"
  exit 0
fi
dump="$1"
[ -s "$dump" ] || die "fichier introuvable : $dump"

read -r -p "La base actuelle sera REMPLACÉE par $dump. Taper OUI pour continuer : " answer </dev/tty
[ "$answer" = "OUI" ] || die "annulé."

info "Sauvegarde de sécurité de la base actuelle"
bash "$DEPLOY_DIR/vps/sauvegarder.sh"
info "Restauration"
dc stop web
dc exec -T db psql -U deekra -d deekra -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
dc exec -T db pg_restore -U deekra -d deekra --no-owner --no-privileges --exit-on-error < "$dump"
migrate_db
dc up -d web
ok "base restaurée"
