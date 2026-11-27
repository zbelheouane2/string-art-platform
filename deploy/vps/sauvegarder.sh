#!/usr/bin/env bash
# Sauvegarde de la base (lancée chaque nuit par /etc/cron.d/deekra-sauvegarde).
# Garde les 14 dernières sauvegardes dans /var/backups/deekra.
. "$(dirname "$(readlink -f "$0")")/commun.sh"
need_root
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
file="$BACKUP_DIR/deekra-$(date +%F-%H%M).dump"
dc exec -T db pg_dump -U deekra -d deekra -Fc --no-owner --no-privileges > "$file.tmp"
[ -s "$file.tmp" ] || die "sauvegarde vide."
mv "$file.tmp" "$file"
chmod 600 "$file"
find "$BACKUP_DIR" -name 'deekra-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) sauvegarde OK : $file ($(du -h "$file" | cut -f1))"
