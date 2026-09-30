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
RUN CI=1 npm run build:web

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
