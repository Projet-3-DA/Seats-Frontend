# Conception
## Conception - App de Réservation de Places de Cinéma

## 1. Modèle de Données
### Diagramme Entité-Association (Sprint 1)
<img width="651" height="886" alt="Capture d’écran 2026-08-24 111048" src="https://github.com/user-attachments/assets/4e9e56ef-047c-4a9d-8c1b-be6590040a8d" />

### Détails des Entités — Sprint 1
### UTILISATEURS (Inscription/Connexion)
id : Entier, clé primaire
email : Chaîne, unique (index pour login)
mot_de_passe : Hash bcrypt (jamais stocké en clair)
nom, prenom : Chaînes obligatoires
role : ENUM('spectateur', 'organisateur', 'admin')
spectateur : Consulte événements, réserve sièges, annule ses réservations
organisateur : Crée salles/événements, voit stats de vente, annule toute réservation
admin : Accès complet
created_at : Timestamp création

### SALLES (Créées par organisateur)
id : Entier, clé primaire
organisateur_id : FK → UTILISATEURS (non nul, créateur)
nom : Chaîne (ex: "Salle du Cégep", "Théâtre Principal")
nombre_rangees : Entier (ex: 10 rangées)
sieges_par_rangee : Entier (ex: 15 sièges par rangée)
created_at : Timestamp
Contrainte : UNIQUE(organisateur_id, nom) — un organisateur a une salle unique par nom

### SIEGES (Générés à partir de SALLES)
id : Entier, clé primaire
salle_id : FK → SALLES (non nul)
numero_rangee : Entier (1 à nombre_rangees)
numero_colonne : Entier (1 à sieges_par_rangee)
created_at : Timestamp
Contrainte : UNIQUE(salle_id, numero_rangee, numero_colonne) — pas de siège dupliqué
Pas de statut ici — le statut est dans RESERVATIONS pour chaque événement (un siège peut être libre pour l'événement A et réservé pour l'événement B)

### EVENEMENTS (Créés par organisateur, associés à une salle)
id : Entier, clé primaire
organisateur_id : FK → UTILISATEURS (non nul, créateur)
salle_id : FK → SALLES (non nul, immuable après création)
titre : Chaîne (ex: "Concert des Anciens")
description : Texte court, optionnel
affiche_url : Chaîne, optionnel — URL de l'image uploadée via `POST /api/evenements/affiche` (migration `ajouter_affiche_evenement`)
date_heure : DateTime (ex: 2024-10-15 20:00:00, en UTC)
tarif : Décimal(8,2), optionnel — prix du billet (migration `ajouter_tarif_evenement`)
created_at : Timestamp
Pas de état "complet" — calculé dynamiquement depuis les réservations confirmées

### RESERVATIONS (Associe spectateur + siège + événement)
id : Entier, clé primaire
spectateur_id : FK → UTILISATEURS (non nul)
siege_id : FK → SIEGES (non nul)
evenement_id : FK → EVENEMENTS (non nul)
statut : ENUM('en_selection', 'confirmee', 'annulee')
en_selection : Siège sélectionné, en attente de confirmation (délai limité)
confirmee : Siège réservé définitivement
annulee : Réservation annulée (siège libéré)
date_selection : Timestamp (quand le siège a été cliqué)
date_confirmation : Timestamp NULL (rempli seulement quand confirmee)
delai_expiration : Timestamp (date jusqu'à laquelle en_selection reste valide)
Contrainte critique : UNIQUE(siege_id, evenement_id) → un siège ne peut être réservé qu'une fois par événement
Contrainte : Si statut = 'confirmee', date_confirmation est non nul


## 2. Routes Principales
### Routes Détaillées (état actuel du code)

#### Authentification — `backend/src/modules/auth`
| Méthode | Route | Auth | Détails |
|---------|-------|------|---------|
| POST | `/api/auth/register` | Publique | Corps : `{ email, motDePasse, nom, prenom, role }`, tous requis. Mot de passe haché (bcrypt). 409 si l'email existe déjà. Réponse : utilisateur créé (sans mot de passe). |
| POST | `/api/auth/login` | Publique | Corps : `{ email, password }`. Réponse : `{ token, user }`. 401 (message générique) si email ou mot de passe invalide. |
| GET | `/api/auth/me` | `Authorization: Bearer <token>` | Retourne l'utilisateur courant (déduit du token, sans mot de passe). |

#### Salles — `backend/src/modules/salles`
| Méthode | Route | Auth | Détails |
|---------|-------|------|---------|
| GET | `/api/salles` | Bearer requis | Liste les salles de l'organisateur courant (`req.user.id`). |
| POST | `/api/salles` | — | Corps : `{ organisateurId, nom, nombreRangees, siegesParRangee }`. Génère les sièges associés. 409 si `(organisateurId, nom)` existe déjà. |
| GET | `/api/salles/:id` | — | Détail d'une salle. 404 si introuvable. |

#### Événements — `backend/src/modules/evenements`
| Méthode | Route | Auth | Détails |
|---------|-------|------|---------|
| GET | `/api/evenements` | — | Liste tous les événements. |
| POST | `/api/evenements` | — | Corps : `{ organisateurId, salleId, titre, description?, dateHeure, afficheUrl?, tarif? }`. 400 si `organisateurId`/`salleId` invalide. |
| GET | `/api/evenements/:id/plan` | — | Plan de salle de l'événement : sièges avec leur état (`reserve` / libre). 404 si événement introuvable. |
| POST | `/api/evenements/affiche` | — | Corps : image brute (`Content-Type: image/png`, etc., 5 Mo max). Upload l'affiche, retourne son URL. |

#### Réservations — `backend/src/modules/reservations`
| Méthode | Route | Auth | Détails |
|---------|-------|------|---------|
| GET | `/api/reservations` | Bearer requis | Liste les réservations de l'utilisateur courant (`req.user.id`), avec événement et siège. |
| POST | `/api/reservations` | Bearer requis, rôle `spectateur` | Corps : `{ evenementId, siegeIds: [...] }`. `spectateurId` vient toujours du token, jamais du corps (sinon un client pourrait réserver au nom d'un autre utilisateur). |


## 3. Maquettes
### Maquettes 1 :  Pages Inscription
<img width="390" height="844" alt="mobile-register" src="maquettes/mobile-register.png" />

### Maquettes 2 :  Pages Connexion
<img width="390" height="844" alt="mobile-login" src="maquettes/mobile-login.png" />

### Maquettes 3 :  Listes des évenements
<img width="390" height="1910" alt="mobile-events-list" src="maquettes/mobile-events-list.png" />

### Maquettes 4 :  Plan de Salle Interactif
<img width="398" height="850" alt="mobile-seat-map" src="maquettes/mobile-seat-map.png" />

### Maquettes 5 :  Confirmation de Réservation
<img width="390" height="844" alt="mobile-booking-confirmation" src="maquettes/mobile-booking-confirmation.png" />

### Maquettes 6 :  Pages Mes Réservations
<img width="390" height="844" alt="mobile-my-reservations" src="maquettes/mobile-my-reservations.png" />

### Maquettes 7 :  Dashboard Organisateur
<img width="390" height="987" alt="mobile-organizer-dashboard" src="maquettes/mobile-organizer-dashboard.png" />

### Maquettes 8 :  Création d'un Évènement
<img width="390" height="955" alt="mobile-create-event" src="maquettes/mobile-create-event.png" />

### Maquettes 9 :  Créer une Salle
<img width="390" height="844" alt="mobile-create-room" src="maquettes/mobile-create-room.png" />

### Maquettes 10 :  Dashboard Admin
<img width="390" height="844" alt="mobile-admin-dashboard" src="maquettes/mobile-admin-dashboard.png" />

### Maquettes 11 :  Dashboard Admin confirmation
<img width="390" height="844" alt="mobile-admin-dashboard-confirm" src="maquettes/mobile-admin-dashboard-confirm.png" />

 
## 4. Registre de Décisions Techniques
 
### Décision 1 : Authentification — JWT vs Session
 
**Question** : Comment gérer l'authentification et la persistance de session?
 
**Options envisagées** :
1. **JWT (token stateless)** : Génère un token signé, stocké côté client. Pas d'état serveur.
2. **Session serveur + cookies** : Stocke session sur serveur, cookie de session côté client.
 
**Choix** : **JWT + HttpOnly Cookies**
- Token JWT signé, payload contient `userId`, `role`
- Cookie `HttpOnly` (non accessible en JS, protection XSS)
- Durée courte (1h), refresh token pour renouvellement (optionnel)
 
**Raison** : 
- Simple pour API REST et stateless
- Scalable si besoin multi-serveurs
- Compatible WebSocket (futur Sprint 2)
 
**Coût** :
- Plus complexe à révoquer immédiatement (on attend l'expiration)
- Nécessite HTTPS en production
- Gestion de refresh token au Sprint 2+
 
---
 
### Décision 2 : Modèle de Données — Places Immuables vs Flexibles
 
**Question** : `places_totales` d'une projection doit-il être modifiable après création?
 
**Options envisagées** :
1. **Immuable** : Une fois la projection créée, `places_totales` est figé. Pas d'édition.
2. **Mutable** : Admin peut changer le nombre de places (ex: ajouter une salle, réduire après quelques réservations).
 
**Choix** : **Immuable**
 
**Raison** :
- Évite les incohérences (si 40 places sur 50 sont réservées, réduire à 30 créerait un conflit)
- Simplifie le calcul de `places_disponibles` = `places_totales - COUNT(réservations confirmées)`
- Admin crée une nouvelle projection s'il faut changer capacité
 
**Coût** :
- Moins flexible, mais acceptable au MVP
- Si besoin futur, créer migration et logique de gestion d'overbooking (Sprint 3+)
 
---
 
### Décision 3 : Gestion d'Images — Upload Local vs Cloud Storage
 
**Question** : Où et comment stocker les affiches de films?
 
**Options envisagées** :
1. **Local** : Serveur stocke images dans `/public/uploads/`
2. **Cloud (S3, Cloudinary, Supabase)** : Tiers externe, CDN inclus
3. **URL externe** : Admin fournit URL directement
 
**Choix** : **URL externe + Cloud Storage optionnel au Sprint 2**
- Sprint 1 : Admin passe une URL (ex: depuis TMDb, IMDB, ou local temporaire)
- Sprint 2+ : Implémenter S3 / Cloudinary pour upload
 
**Raison** :
- MVP rapide : pas de dépendance externe au Sprint 1
- Données testables sans fichiers
- Clarté : API prête, implémentation upload report
 
**Coût** :
- Admin doit trouver URL valide
- Images cassées si lien tiers expire
- Futur : migration vers S3 obligatoire en production

---

### Décision 4 : Accès aux données — Prisma + migrations versionnées

**Question** : Comment le backend accède-t-il à Postgres, et comment le schéma évolue-t-il dans le temps ?

**Options envisagées** :
1. **SQL brut** : requêtes écrites à la main avec `pg`.
2. **Prisma ORM + migrations** : schéma déclaré dans `schema.prisma`, migrations générées et versionnées dans `prisma/migrations/`.

**Choix** : **Prisma + migrations**
- Le schéma (`backend/prisma/schema.prisma`) est la source de vérité du modèle de données.
- Chaque changement de schéma est une migration SQL versionnée dans `prisma/migrations/` (ex. `ajouter_affiche_evenement`, `ajouter_tarif_evenement`), appliquée avec `npx prisma migrate deploy`.

**Raison** :
- Le schéma et son historique vivent dans le code (revue de PR possible), pas seulement en tête de quelqu'un.
- Mêmes migrations appliquées en local, en CI et en production → pas de dérive entre environnements.

**Coût** :
- Une migration mal écrite peut verrouiller une table en production ; à surveiller à mesure que les tables grossissent.

---

### Décision 5 : Déploiement — Docker Compose + image publiée sur GHCR

**Question** : Comment lancer le backend et sa base en local, et comment le livrer en production ?

**Choix** : **`docker-compose.yml` pour le Postgres local + image Docker publiée sur ghcr.io**
- `docker compose up -d` démarre un Postgres local identique à celui utilisé en CI (mêmes identifiants, même nom de base) pour que les commandes soient reproductibles en local comme en CI.
- Le `Dockerfile` (`backend/Dockerfile`) construit l'image de l'API ; la CI (`.github/workflows/ci.yml`, job `image`) la publie sur `ghcr.io/<owner>/seats-backend`, taguée `latest` et `sha-<commit>`, uniquement si les tests passent et seulement sur le tag `latest` (pas à chaque push).

**Raison** :
- Un seul `docker compose up` suffit pour développer sans installer Postgres localement (voir vision du projet).
- GHCR est inclus gratuitement avec GitHub, pas de compte tiers à gérer ; `GITHUB_TOKEN` suffit, aucun secret à créer.

**Coût** :
- Le tag `latest` est mobile (`git tag -f` + push force) : publier une nouvelle image demande une étape manuelle, pas un déploiement continu automatique.

---

### Décision 6 : Stratégie de tests — mocks en unitaire, vrai Postgres en intégration

**Question** : Comment tester la logique métier sans dépendre d'une vraie base à chaque exécution, tout en validant les garanties que seule la base peut fournir (ex. contrainte d'unicité sous accès concurrent) ?

**Choix** : **Deux suites séparées**
- Tests unitaires (`*.test.js`) : Prisma est simulé (`src/lib/__mocks__/prisma.js`), le client généré n'est jamais requis. Rapides, aucun secret ni base nécessaire, job `test` de la CI.
- Tests d'intégration (`*.integration.test.js`) : tournent contre un vrai Postgres (service Docker en CI, `docker-compose.yml` en local), job `test-integration` de la CI. Utilisés pour prouver des garanties réelles de la base (ex. unicité `(siegeId, evenementId)` sous confirmation concurrente).

**Raison** :
- Les mocks ne peuvent pas prouver qu'une contrainte d'unicité tient sous accès concurrent réel ; seul un vrai Postgres le peut.
- Séparer les deux garde la suite unitaire rapide et sans dépendance, tout en gardant une suite d'intégration qui attrape les régressions que les mocks masqueraient.

**Coût** :
- Deux suites à maintenir ; la suite d'intégration est plus lente et nécessite Postgres (Docker) pour tourner en local.
