# Déploiement sur le serveur du département (#19)

Seats tourne sur le serveur du département avec Docker Compose. Tout passe par **une seule adresse publique** : le reverse proxy Caddy envoie `/api` et `/socket.io` au backend, et le reste au frontend.

```
navigateur / app mobile ──► Caddy (port 80, ou 443 en HTTPS)
                             ├── /api/*, /socket.io/* ──► backend (Express, port 3000 interne)
                             └── le reste ─────────────► frontend (Expo web, port 3000 interne)
                                                          backend ──► db (Postgres 17, volume)
```

Les fichiers se trouvent dans [`deploy/`](../deploy) :

| Fichier | Rôle |
|---|---|
| `compose.prod.yml` | Les quatre services (db, backend, frontend, caddy), qui redémarrent automatiquement. |
| `Caddyfile` | Les règles du reverse proxy. |
| `env.example` | Le modèle de configuration. Sur le serveur, on le copie en `deploy/.env`, qui n'est jamais commité. |
| `mettre-a-jour.sh` | Reconstruit et redémarre l'application quand `main` a changé dans l'un des deux dépôts. |

## Prérequis sur le serveur

- Linux avec Docker Engine et le plugin Compose (`docker compose version`), ainsi que `git` et `flock` (paquet `util-linux`, présent par défaut).
- Un accès sortant vers GitHub (clone, construction du backend) et Docker Hub (images `postgres`, `caddy`, `node`).
- Le port 80 (et 443 pour HTTPS) joignable depuis le réseau des utilisateurs. S'ils sont pris, on change `HTTP_PORT` et `HTTPS_PORT`.

## Première installation

```sh
git clone https://github.com/Projet-3-DA/Seats-Frontend.git ~/seats
cd ~/seats
cp deploy/env.example deploy/.env
```

Remplir `deploy/.env` :

- **`SEATS_URL`** : l'adresse que les utilisateurs taperont, par exemple `http://10.0.0.42` ou `https://seats.exemple.ca`. Elle est figée dans l'application web au moment de la construction.
- **`SITE_ADDRESS`** : `:80` pour une adresse IP ou un nom interne. Pour un nom de domaine public, mettre ce nom, et Caddy obtient le certificat HTTPS tout seul.
- **`POSTGRES_PASSWORD`** et **`JWT_SECRET`** : deux longues chaînes aléatoires (`openssl rand -hex 32`). La pile refuse de démarrer sans elles.
- `SUPABASE_*` : facultatif, seulement pour envoyer des affiches.

Lancer ensuite :

```sh
sh deploy/mettre-a-jour.sh --force
```

La première construction prend quelques minutes. Au démarrage, le backend applique les migrations Prisma et crée les comptes de démonstration (mot de passe `Demo1234!`). L'application est alors accessible à `SEATS_URL`.

## Mises à jour : automatiques

Le script ne reconstruit l'application que si le dernier commit de `main` a changé dans Seats-Frontend, ou dans Seats-Backend (branche `BACKEND_REF`). On le lance toutes les 5 minutes avec cron (`crontab -e`) :

```
*/5 * * * * sh ~/seats/deploy/mettre-a-jour.sh >> ~/seats/deploy/deploiement.log 2>&1
```

Une PR fusionnée dans `main` est donc en ligne environ 5 à 10 minutes plus tard, construction comprise. C'est le serveur qui va chercher les nouveautés : GitHub n'a besoin d'aucun accès au serveur, ni d'aucun secret.

Pour déployer tout de suite, ou après avoir modifié `deploy/.env` : `sh deploy/mettre-a-jour.sh --force`.

## Persistance des données

- Les données vivent dans le volume Docker `seats-prod_seats_prod_db`. Elles survivent aux mises à jour, aux redémarrages des conteneurs et du serveur.
- Les migrations sont appliquées au démarrage du backend, sans effacer de données.
- **Ne jamais lancer `docker compose down -v`** : l'option `-v` supprime le volume, donc toute la base.

Sauvegarde et restauration :

```sh
docker compose -f deploy/compose.prod.yml --env-file deploy/.env exec -T db pg_dump -U seats seats > sauvegarde.sql
docker compose -f deploy/compose.prod.yml --env-file deploy/.env exec -T db psql -U seats seats < sauvegarde.sql
```

## Surveiller et dépanner

```sh
docker compose -f deploy/compose.prod.yml --env-file deploy/.env ps              # état des services
docker compose -f deploy/compose.prod.yml --env-file deploy/.env logs -f backend # journaux de l'API
tail -n 50 deploy/deploiement.log                                                # journal des déploiements
```

- **La page s'affiche, mais la connexion échoue** : `SEATS_URL` ne correspond pas à l'adresse tapée dans le navigateur. Corriger la valeur, puis relancer avec `--force`.
- **Le backend redémarre en boucle** : regarder les journaux du backend. C'est souvent une migration en échec ou un `deploy/.env` incomplet.

## Application mobile

Le build mobile (Expo) doit viser l'adresse publique. Avant de construire, définir `EXPO_PUBLIC_API_URL=<SEATS_URL>/api`.
