# Vision
## Le problème
Les organismes étudiants et les petites salles (théâtre étudiant, ciné-club, troupe d'improvisation, salle de spectacle communautaire) vendent souvent leurs places par des moyens artisanaux : feuille Excel partagée, formulaire Google, ou pire, une liste papier au guichet. Ces méthodes ne montrent jamais en temps réel quels sièges sont pris, ce qui mène régulièrement à des doubles réservations découvertes seulement le soir de l'événement, quand deux groupes se présentent avec le même numéro de siège.
## Les personnes utilisatrices
| Profil | Ce qu'il fait | Rôle applicatif |
| :--- | :--- | :--- |
| **Organisateur** | Créer un événement, configurer le plan de la salle, suivre les ventes en direct, annuler une réservation en cas de problème | ```organisateur``` |
| **Spectateur** | Voir les événements à venir, choisir ses sièges sur un plan clair, réserver rapidement sans craindre de perdre son siège au profit de quelqu'un d'autre | ```spectateur``` |
| **Administrateur** | Il voit tous les organisateurs inscrits sur la plateforme et tous les événements créés, peu importe qui les a créés. Il peut suspendre un compte (organisateur ou spectateur) en cas d'abus | ```Admin``` |
---
## Proposition
**Seats** est une application qui permet à un organisateur de vendre les places d'un événement sur un plan de salle interactif, et à un spectateur de réserver ses sièges en temps réel avec la certitude que sa réservation est définitive. L'application est accessible via **deux clients** partageant le même backend : une application mobile (développée en priorité) et une application web.
## Dans la portée
- Création d'un compte et connexion, avec un rôle organisateur ou spectateur attribué à l'inscription.
- Un organisateur peut créer une salle avec un nombre de rangées et de colonnes
- Un organisateur peut créer un événement (titre, description, date, lieu) et lui associer une salle
- Un spectateur peut parcourir la liste des événements à venir et consulter le plan de salle d'un événement.
- Un spectateur peut sélectionner un ou plusieurs sièges libres; le siège passe alors dans un état « en cours de sélection » visible par tous les autres spectateurs regardant le même plan, avec un délai limité pour confirmer.
- Confirmation de la réservation : le ou les sièges passent définitivement à l'état « réservé », associés au compte du spectateur.
- Si le délai de sélection expire sans confirmation, le ou les sièges redeviennent libres pour tout le monde.
- L'organisateur voit en direct l'état de vente de son événement (sièges vendus / disponibles) et peut annuler une réservation.
- Un spectateur peut consulter la liste de ses réservations et annuler une réservation à venir.
- Une application mobile (React Native) et une application web (React) consomment la même API backend.
## Hors de la portée
- Le paiement réel (carte de crédit, Stripe, PayPal, etc.). Le paiement est simulé : confirmer une réservation vaut acceptation, sans transaction monétaire réelle. Ça évite une dépendance à un service externe payant.
- L'envoi de courriels ou de notifications SMS de confirmation.
- L'édition visuelle du plan de salle par glisser-déposer : au sprint 1, un plan de salle se configure par un nombre de rangées et de sièges par rangée (grille simple), pas par un éditeur graphique.
- La revente ou le transfert d'une place entre deux spectateurs.
- La billetterie récurrente multi-représentations d'un même spectacle (une seule séance par événement pour l'instant).
- Un mode « liste d'attente » pour les événements complets.
- La gestion de plusieurs organismes/salles avec des comptes organisateurs hiérarchisés (administrateur global, etc.) — un seul rôle organisateur suffit pour cette session.
## Respect des exigences techniques
| # | Exigence | Technologie retenue | Comment le projet la satisfait |
|---|---|---|---|
| 1 | Application client-serveur, cadriciel full stack SSR + CSR | Node.js (backend commun), React Native (client mobile), React + React Router v7 mode framework (client web, SSR) | Le backend Node.js expose une API REST/WebSocket commune aux deux clients. Le client web (React Router v7) assure le rendu côté serveur au premier chargement des pages (liste des événements, plan de salle, tableau de bord organisateur), puis les interactions (sélection de siège, mise à jour en direct) sont gérées côté client. Le client mobile (React Native) consomme la même API en CSR pur, comme c'est la norme pour une application native. |
| 2 | Base de données transactionnelle | PostgreSQL | Toutes les opérations de réservation (verrouillage d'un siège, confirmation, expiration) passent par des transactions SQL pour garantir qu'un siège n'est jamais attribué à deux personnes. |
| 3 | Installation et démarrage via Docker | Docker + Docker Compose | Un seul `docker compose up` démarre le backend et la base de données, sans installation locale de Node ou PostgreSQL. Le client web se lance dans le même environnement conteneurisé ; le client mobile se lance séparément via les outils standards React Native (Expo ou émulateur), documentés dans le README. |
| 4 | Deux rôles d'utilisateur aux permissions réellement différentes | Authentification maison (courriel + mot de passe, ou OAuth2 dès qu'enseigné) | `organisateur` peut créer/modifier un événement et une salle, voir les statistiques de vente, annuler des réservations. `spectateur` peut seulement consulter, réserver et annuler ses propres réservations. Ces permissions sont vérifiées côté serveur, pas seulement cachées dans l'interface — et ce, peu importe le client (web ou mobile) qui émet la requête. |
| 5 | Fonctionnalité temps réel multi-utilisateurs | Socket.IO (WebSockets) | Le plan de salle d'un événement est une vue partagée : dès qu'un siège change d'état (libre → en sélection → réservé, ou l'inverse en cas d'expiration), tous les spectateurs regardant ce plan voient le changement sans recharger la page, que ce soit sur mobile ou sur web. C'est le cœur de l'application, pas une fonctionnalité ajoutée en périphérie. |
| 6 | Point de concurrence réel | Transaction PostgreSQL avec contrainte d'unicité (`evenement_id`, `siege_id`) sur la table des réservations, ou verrouillage `SELECT ... FOR UPDATE` | Deux spectateurs cliquent sur le même siège au même instant : le serveur ne laisse passer qu'une seule confirmation. La seconde tentative reçoit un refus explicite et immédiat, et le client (web ou mobile) resynchronise l'affichage sur l'état réel du serveur. |
| 7 | Tests automatisés à chaque poussée | GitHub Actions | Une chaîne CI exécute les tests (au minimum : logique de réservation, y compris le scénario de double clic simultané) à chaque poussée sur le dépôt, pour le backend commun aux deux clients. |
| 8 | Déploiement sur un serveur | Serveur du département ou hébergeur externe (à préciser en cours de session) | Le backend et le client web sont accessibles par une URL publique, pas seulement en local sur les portables de l'équipe. Le client mobile est distribué séparément (build de développement / APK), selon la procédure documentée en cours de session. |
---
