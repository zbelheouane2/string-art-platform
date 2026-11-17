#!/bin/sh
# Démarrage du service Render : moteur en interne, base à jour, puis le site.
set -e
cd /app/engine
uvicorn stringart.api:app --host 127.0.0.1 --port 8000 --workers 1 &
cd /app/tools
node node_modules/prisma/build/index.js migrate deploy
node node_modules/tsx/dist/cli.mjs prisma/seed.ts
cd /app/web
exec node server.js
