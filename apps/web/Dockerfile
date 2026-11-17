FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Réglages publics, fixés au moment de la construction (voir deploy/.env.prod.example).
ARG NEXT_PUBLIC_BRAND_NAME=DeeKra
ARG NEXT_PUBLIC_ORDERING_OPEN=true
ARG NEXT_PUBLIC_SUPPORT_EMAIL=
ARG NEXT_PUBLIC_WHATSAPP=
ARG NEXT_PUBLIC_INSTAGRAM_URL=
ARG NEXT_PUBLIC_FACEBOOK_URL=
ARG NEXT_PUBLIC_TIKTOK_URL=
ARG NEXT_PUBLIC_LEGAL_ANPDP=
ENV NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME NEXT_PUBLIC_ORDERING_OPEN=$NEXT_PUBLIC_ORDERING_OPEN \
    NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP \
    NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL \
    NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL NEXT_PUBLIC_LEGAL_ANPDP=$NEXT_PUBLIC_LEGAL_ANPDP
# Adresse factice pour la construction seulement (aucune connexion) ; la vraie est donnée au démarrage.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN useradd --system --uid 10001 web
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER web
EXPOSE 3000
CMD ["node", "server.js"]
