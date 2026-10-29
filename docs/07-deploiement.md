# Déploiement en ligne : Render + Supabase (#19)

Seats est en ligne sur deux adresses publiques, hébergées gratuitement par [Render](https://render.com) :

| Service | Contenu | Adresse |
|---|---|---|
| `seats-frontend` | L'application web, celle que les utilisateurs ouvrent | `https://seats-frontend.onrender.com` |
| `seats-backend` | L'API Express et le temps réel (Socket.IO) | `https://seats-backend.onrender.com/api` |

Les adresses ci-dessus sont celles que Render attribue si les noms sont libres ; sinon, prendre celles affichées dans le tableau de bord Render.

Render construit chaque service à partir de son `Dockerfile`, le même que pour `docker compose`. Toute la configuration est dans [`render.yaml`](../render.yaml) (un *Blueprint* Render). La base de données est le projet **Supabase** : les données persistent d'un déploiement et d'une session à l'autre.

## Mises à jour

Chaque service se redéploie automatiquement après chaque commit sur `main` de son dépôt, donc après chaque PR fusionnée. Le nouveau déploiement est en ligne quelques minutes plus tard ; l'ancienne version reste servie pendant la construction.

Au démarrage, le backend applique les migrations Prisma sur Supabase et recrée les comptes de démonstration : aucune commande manuelle après une fusion.

Redéploiement manuel : ouvrir le service dans Render, puis **Manual Deploy** > **Deploy latest commit**.

## Mise en place (une seule fois)

1. **Supabase** : dans le projet, ouvrir **Connect** et copier l'URL du **Session pooler** (port 5432). Elle sert à la fois pour `DATABASE_URL` et `DIRECT_URL`. Ne pas prendre la connexion directe `db.<ref>.supabase.co`, joignable seulement en IPv6, que Render ne gère pas.
2. **Render** : créer un compte avec **Sign in with GitHub**, puis autoriser l'application Render sur l'organisation **Projet-3-DA** pour les dépôts Seats-Backend et Seats-Frontend. Un propriétaire de l'organisation doit approuver.
3. Dans Render : **New** > **Blueprint** > dépôt **Seats-Frontend**, branche `main`. Render lit `render.yaml` et demande les valeurs secrètes :

   | Variable | Service | Valeur |
   |---|---|---|
   | `DATABASE_URL`, `DIRECT_URL` | backend | URL du Session pooler, avec le mot de passe de la base |
   | `BACKEND_URL` | backend | `https://seats-backend.onrender.com` |
   | `FRONTEND_URL` | backend | `https://seats-frontend.onrender.com` |
   | `EXPO_PUBLIC_API_URL` | frontend | `https://seats-backend.onrender.com/api` |
   | `GITHUB_*`, `GOOGLE_*`, `MICROSOFT_*` | backend | Facultatif : voir [Connexion externe](#connexion-externe-en-ligne). Laisser vide pour désactiver le fournisseur. |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | backend | Facultatif : envoi de fichiers d'affiche |

   `JWT_SECRET` est généré par Render.
4. **Apply**. Le premier déploiement prend environ 10 minutes. Si Render a donné d'autres adresses que celles saisies, corriger les variables concernées (**Environment** du service, puis **Save**) : le service se reconstruit avec les bonnes valeurs.

**Vérification**

- `https://seats-backend.onrender.com/` répond `{"status":"ok", …}` ;
- sur `https://seats-frontend.onrender.com`, se connecter avec un compte de démonstration (mot de passe `Demo1234!`), créer un événement, se déconnecter puis se reconnecter : l'événement est toujours là ;
- ouvrir le plan d'un événement dans deux navigateurs : une sélection de siège apparaît dans l'autre (Socket.IO passe bien).

## Connexion externe en ligne

Chaque fournisseur doit connaître l'adresse de retour publique, en plus de celle de développement :

- **GitHub** : une OAuth App n'accepte qu'une seule *Authorization callback URL*. Créer une seconde OAuth App pour la production, avec `https://seats-backend.onrender.com/api/auth/github/callback`, et mettre ses identifiants dans Render, ainsi que `GITHUB_CALLBACK_URL` avec la même adresse.
- **Google** : dans la console Google Cloud, ajouter `https://seats-backend.onrender.com/api/auth/google/callback` aux URI de redirection autorisés du client OAuth existant.
- **Microsoft** : dans Entra ID, ajouter `https://seats-backend.onrender.com/api/auth/microsoft/callback` aux URI de redirection (plateforme Web) de l'application existante.

## À savoir (offre gratuite)

- **Mise en veille** : un service sans visite pendant 15 minutes s'endort ; la visite suivante le réveille en 30 à 60 secondes. Avant une démonstration, ouvrir les deux adresses une minute à l'avance.
- **Une seule base** : l'application en ligne utilise la même base Supabase que l'équipe en développement. Pour les séparer, créer un second projet Supabase (l'offre gratuite en permet deux) et mettre ses URL dans Render.
- **Comptes de démonstration** : recréés à chaque démarrage avec le mot de passe public `Demo1234!`, administrateur compris.
- **Variables `EXPO_PUBLIC_*`** : figées au build du frontend. Les modifier dans Render relance la construction.

## Dépannage

- **La page s'ouvre mais la connexion échoue** : `EXPO_PUBLIC_API_URL` ne pointe pas vers le backend, ou le backend se réveille encore. Ouvrir l'adresse du backend, attendre sa réponse, réessayer.
- **La connexion GitHub/Google/Microsoft ramène vers `localhost`** : `FRONTEND_URL`, `BACKEND_URL` ou `GITHUB_CALLBACK_URL` manquent dans le backend.
- **Le backend échoue au démarrage** : lire ses **Logs** dans Render. Une erreur `P1001` (base injoignable) vient presque toujours d'une URL de connexion directe au lieu du Session pooler, ou d'un mot de passe mal saisi.
- **Rien ne se déploie après une fusion** : vérifier que l'application Render a accès au dépôt (GitHub > organisation > **Settings** > **GitHub Apps**).

## Application mobile

Le build mobile (Expo) doit viser l'API publique : définir `EXPO_PUBLIC_API_URL=https://seats-backend.onrender.com/api` avant de le construire.
