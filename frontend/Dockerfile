# Image web du frontend Seats (export Expo statique/SSR servi par server.js).
# Contexte de construction : frontend/ (ce dossier).
FROM node:24-alpine
WORKDIR /app

# Manifestes d'abord : tant qu'ils ne changent pas, npm ci reste en cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Expo fige EXPO_PUBLIC_* dans le bundle au moment du build : l'adresse de l'API vue par le navigateur
# doit donc être fournie ici (docker-compose la définit).
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
# CI=1 empêche `expo export` de tenter des prompts interactifs.
# Metro lance par défaut un worker par cœur, chacun avec sa copie du bundler : avec les 512 Mo de
# l'offre gratuite Render, la construction s'enlisait jusqu'au délai de 45 min. Un seul worker et un
# tas plafonné tiennent dans cette mémoire (~40 s en local, sans cache).
RUN CI=1 NODE_OPTIONS=--max-old-space-size=384 npm run build:web -- --max-workers 1

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
