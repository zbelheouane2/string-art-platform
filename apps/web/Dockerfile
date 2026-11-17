FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Adresse factice pour la construction seulement (aucune connexion) ; la vraie est donnée au démarrage.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --uid 10001 web
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER web
EXPOSE 3000
CMD ["node", "server.js"]
