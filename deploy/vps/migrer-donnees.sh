#!/usr/bin/env bash
# Copie toutes les données de l'ancienne base (Supabase, Render…) dans la base du VPS :
# commandes, codes d'activation, prix, tarifs de livraison, promotions, réglages.
#
#   bash /opt/deekra/deploy/vps/migrer-donnees.sh
#
# L'adresse de l'ancienne base (DATABASE_URL de Render, qui commence par postgresql://) est demandée
# à l'écran et n'est enregistrée nulle part. L'ancienne base n'est que lue, jamais modifiée.
# On peut relancer ce script autant de fois que nécessaire (par ex. juste avant de changer le DNS) :
# la base du VPS est alors remplacée par une copie fraîche, après une sauvegarde de sécurité.
. "$(dirname "$(readlink -f "$0")")/commun.sh"
need_root

OLD_URL="${OLD_DATABASE_URL:-}"
if [ -z "$OLD_URL" ]; then
  read -r -s -p "Adresse de l'ancienne base (postgresql://…, rien ne s'affiche, c'est normal) : " OLD_URL </dev/tty
  echo
fi
case "$OLD_URL" in
  postgres://*|postgresql://*) ;;
  *) die "l'adresse doit commencer par postgresql://" ;;
esac
case "$OLD_URL" in
  *render.com*) warn "ancienne base sur Render : si elle est en offre gratuite, elle est supprimée 30 jours après sa création." ;;
esac

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
chmod 700 "$work"

info "Lecture de l'ancienne base (seulement les tables du site, schéma public)"
# Image officielle PostgreSQL 17 pour lire une base 15, 16 ou 17. La connexion se fait en SSL si
# l'hébergeur l'exige (Supabase, Render). L'adresse passe par une variable, pas par la ligne de commande.
docker run --rm -e OLD_URL="$OLD_URL" -v "$work:/out" "$PG_CLIENT_IMAGE" \
  sh -c 'pg_dump "$OLD_URL" -Fc --schema=public --no-owner --no-privileges -f /out/ancienne.dump' \
  || die "impossible de lire l'ancienne base. Vérifier l'adresse (mot de passe compris)."
[ -s "$work/ancienne.dump" ] || die "copie vide."
ok "copie lue ($(du -h "$work/ancienne.dump" | cut -f1))"

dc up -d db
wait_db
if dc exec -T db psql -U deekra -d deekra -tAc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL" | grep -q t; then
  info "Sauvegarde de sécurité de la base du VPS avant remplacement"
  bash "$DEPLOY_DIR/vps/sauvegarder.sh"
fi

info "Import dans la base du VPS"
dc stop web >/dev/null 2>&1 || true
dc exec -T db psql -U deekra -d deekra -v ON_ERROR_STOP=1 -q -c "DROP SCHEMA IF EXISTS public CASCADE;"
# La copie (--schema=public) recrée elle-même le schéma public puis son contenu.
docker run --rm -i --network deekra_default -e PGPASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "$DEPLOY_DIR/.env" | cut -d= -f2-)" \
  -v "$work:/in:ro" "$PG_CLIENT_IMAGE" \
  pg_restore -h db -U deekra -d deekra --no-owner --no-privileges --exit-on-error /in/ancienne.dump \
  || die "l'import a échoué. La base du VPS est vide : relancer le script, ou restaurer la sauvegarde (restaurer.sh)."

migrate_db
dc up -d web

info "Vérification"
dc exec -T db psql -U deekra -d deekra -c 'SELECT
  (SELECT count(*) FROM "Order")           AS commandes,
  (SELECT count(*) FROM "ActivationCode")  AS codes,
  (SELECT count(*) FROM "DeliveryRate")    AS tarifs_livraison' 2>/dev/null \
  || warn "comptage impossible (noms de tables différents), vérifier dans /admin."
ok "données copiées. Comparer ces chiffres avec l'admin de l'ancien site."
