# Plateforme String Art

Kits de portraits en fil personnalisés : boutique, génération du portrait à partir d'une photo, guide de réalisation. Exigences : `docs/cahier-des-charges.md`.

## Structure

| Dossier | Contenu |
|---|---|
| `apps/web` | Site Next.js (FR, EN, AR en RTL), base PostgreSQL via Prisma |
| `services/engine` | Moteur de génération (Python) et son service HTTP (FastAPI) |
| `docs/` | Cahier des charges, algorithme, tests, rétro-ingénierie, historique |
| `PRODUCT.md`, `DESIGN.md` | Contexte produit et système visuel |

## Démarrer en local

Avec Docker :

```bash
docker compose up --build        # http://localhost:3000
docker compose exec web npx prisma migrate deploy
```

Sans Docker (PostgreSQL 16 local, Python 3.11+, Node 22) :

```bash
# Moteur
cd services/engine && pip install -e ".[api,dev]"
ENGINE_TOKEN=dev-token uvicorn stringart.api:app --port 8000

# Site
cd apps/web && cp .env.example .env && npm install
npx prisma migrate deploy && npx prisma generate && npx prisma db seed
npm run dev
```

## Tests

```bash
cd services/engine && python -m pytest -q          # moteur et service HTTP
cd apps/web && npm test                            # unitaires
cd apps/web && npm run build && npm start & npm run test:e2e   # navigateur + accessibilité
```
