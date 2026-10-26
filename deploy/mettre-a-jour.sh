#!/bin/sh
# Met à jour Seats sur le serveur (#19) : reconstruit et redémarre l'application si la branche main
# de Seats-Frontend ou la branche BACKEND_REF de Seats-Backend a changé depuis le dernier déploiement.
#
#   sh deploy/mettre-a-jour.sh           # ne fait rien si rien n'a changé
#   sh deploy/mettre-a-jour.sh --force   # reconstruit quand même (ex. après avoir modifié deploy/.env)
#
# Lancé toutes les 5 minutes par cron, il donne le déploiement automatique sans que GitHub ait besoin
# d'accéder au serveur (voir docs/07-deploiement.md). Les migrations Prisma s'appliquent au démarrage
# du backend (docker-entrypoint.sh) ; les données de la base sont dans un volume et sont conservées.
set -eu

RACINE=$(cd "$(dirname "$0")/.." && pwd)
cd "$RACINE"

ENV_FICHIER=deploy/.env
ETAT=deploy/.dernier-deploiement
DEPOT_BACKEND=https://github.com/Projet-3-DA/Seats-Backend.git

if [ ! -f "$ENV_FICHIER" ]; then
  echo "Il manque $ENV_FICHIER : copier deploy/env.example et le remplir." >&2
  exit 1
fi

# Un seul déploiement à la fois (cron peut relancer le script pendant une longue construction).
exec 9>"deploy/.verrou"
if ! flock -n 9; then
  echo "Un déploiement est déjà en cours."
  exit 0
fi

BACKEND_REF=$(sed -n 's/^BACKEND_REF=//p' "$ENV_FICHIER")
BACKEND_REF=${BACKEND_REF:-main}

git fetch --quiet origin main
FRONTEND_SHA=$(git rev-parse origin/main)
BACKEND_SHA=$(git ls-remote "$DEPOT_BACKEND" "$BACKEND_REF" | cut -f1 | head -n 1)
if [ -z "$BACKEND_SHA" ]; then
  echo "Référence « $BACKEND_REF » introuvable dans Seats-Backend." >&2
  exit 1
fi
VOULU="$FRONTEND_SHA $BACKEND_SHA"

if [ "${1:-}" != "--force" ] && [ -f "$ETAT" ] && [ "$(cat "$ETAT")" = "$VOULU" ]; then
  exit 0
fi

echo "$(date '+%F %T') Déploiement : frontend $FRONTEND_SHA, backend $BACKEND_SHA"
git merge --ff-only --quiet origin/main
# Le contexte de build du backend pointe sur le commit précis : Docker reconstruit bien la nouvelle
# version au lieu de réutiliser une ancienne copie de la branche.
BACKEND_REF=$BACKEND_SHA docker compose -f deploy/compose.prod.yml --env-file "$ENV_FICHIER" up -d --build --remove-orphans
docker image prune -f >/dev/null

echo "$VOULU" > "$ETAT"
echo "$(date '+%F %T') Déploiement terminé."
