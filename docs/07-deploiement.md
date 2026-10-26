# Déploiement en ligne : Render + Supabase (#19)

Seats est en ligne sur deux adresses publiques, hébergées gratuitement par [Render](https://render.com) :

| Service | Contenu | Adresse (exemple) |
|---|---|---|
| `seats-frontend` | L'application web, celle que les utilisateurs ouvrent | `https://seats-frontend.onrender.com` |
| `seats-backend` | L'API Express | `https://seats-backend.onrender.com/api` |

La base de données est le projet **Supabase**, donc les données persistent d'un déploiement à l'autre. Render construit chaque service à partir de son `Dockerfile`, le même que pour `docker compose`. Toute la configuration se trouve dans [`render.yaml`](../render.yaml), un *Blueprint* Render.

## Mises à jour automatiques

Chaque service se redéploie tout seul après chaque commit sur `main` de son dépôt, donc après chaque PR fusionnée. Le nouveau déploiement est en ligne quelques minutes plus tard. Pendant la construction, l'ancienne version reste en ligne.

Au démarrage, le backend applique les migrations Prisma sur Supabase. Il n'y a donc plus besoin de lancer `npx prisma migrate deploy` à la main après une fusion (risque 5 de [06-risques.md](06-risques.md)).

Pour redéployer à la main, ouvrir le service dans le tableau de bord Render, puis choisir **Manual Deploy** et **Deploy latest commit**.

## Mise en place (une seule fois)

1. **Supabase** : dans le projet, ouvrir **Connect**, puis copier l'URL du **Session pooler**. C'est elle qu'on utilise pour `DATABASE_URL` et pour `DIRECT_URL`, et non l'URL de connexion directe `db.<ref>.supabase.co`, qui n'est joignable qu'en IPv6 alors que Render ne fonctionne qu'en IPv4. Noter aussi la région du projet.
2. **Render** : créer un compte avec **Sign in with GitHub**. Autoriser l'application Render sur l'organisation **Projet-3-DA**, pour les deux dépôts Seats-Backend et Seats-Frontend. C'est un propriétaire de l'organisation qui doit le faire.
3. Si la région Supabase n'est pas `us-east-1`, remplacer `region: virginia` dans `render.yaml` par la région Render la plus proche (`ohio`, `oregon`, `frankfurt` ou `singapore`). Ce choix ne peut plus changer une fois les services créés.
4. Dans Render, choisir **New**, puis **Blueprint**, puis le dépôt **Seats-Frontend** (branche `main`). Render lit `render.yaml` et demande les valeurs secrètes :
   - `DATABASE_URL` et `DIRECT_URL` : l'URL du Session pooler, avec le mot de passe de la base.
   - `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` : facultatives, elles ne servent qu'aux affiches.
   - `EXPO_PUBLIC_API_URL` : `https://seats-backend.onrender.com/api`. Si Render a donné un autre nom au backend, utiliser son adresse affichée et ajouter `/api` à la fin.

   `JWT_SECRET` est généré par Render.
5. Cliquer sur **Apply**. Le premier déploiement prend environ 10 minutes. Si l'adresse réelle du backend diffère de celle saisie à l'étape 4, corriger `EXPO_PUBLIC_API_URL` dans **seats-frontend**, puis **Environment**, puis enregistrer : le frontend se reconstruit avec la bonne adresse.

Vérification :
- `https://seats-backend.onrender.com/` répond `{"status":"ok", …}` ;
- sur l'application web, on peut se connecter avec un compte de démonstration (mot de passe `Demo1234!`).

## À savoir (offre gratuite)

- **Mise en veille** : un service sans visite pendant 15 minutes s'endort. La visite suivante le réveille en 30 à 60 secondes. Avant une démonstration, ouvrir les deux adresses une minute à l'avance.
- **Une seule base pour le développement et la production** : avec cette configuration, l'application en ligne utilise la même base Supabase que l'équipe en développement. Pour les séparer, créer un second projet Supabase (l'offre gratuite en permet deux) et mettre ses URL dans Render.
- **Comptes de démonstration** : ils sont recréés au démarrage avec le mot de passe `Demo1234!`. Ce mot de passe est public, l'administrateur compris.
- Les variables `EXPO_PUBLIC_*` sont figées au build. Après les avoir modifiées, il faut reconstruire le frontend (Render le fait automatiquement quand on enregistre).

## Dépannage

- **La page s'ouvre, mais la connexion échoue** : `EXPO_PUBLIC_API_URL` ne pointe pas vers le backend, ou le backend dort encore. Ouvrir l'adresse du backend, attendre sa réponse, puis réessayer.
- **Le backend échoue au démarrage** : lire ses **Logs** dans Render. Un message `P1001` (base injoignable) vient presque toujours d'une URL de connexion directe au lieu du Session pooler, ou d'un mot de passe mal saisi.
- **Le déploiement ne se lance pas après une fusion** : vérifier que l'application Render a bien accès au dépôt concerné (GitHub, puis **Settings**, puis **GitHub Apps**).

## Application mobile

Le build mobile (Expo) doit viser l'API publique. Avant de le construire, définir `EXPO_PUBLIC_API_URL=https://seats-backend.onrender.com/api`.
