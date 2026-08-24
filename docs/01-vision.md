# Vision
## Le problème
Les organismes étudiants et les petites salles (théâtre étudiant, ciné-club, troupe d'improvisation, salle de spectacle communautaire) vendent souvent leurs places par des moyens artisanaux : feuille Excel partagée, formulaire Google, ou pire, une liste papier au guichet. Ces méthodes ne montrent jamais en temps réel quels sièges sont pris, ce qui mène régulièrement à des doubles réservations découvertes seulement le soir de l'événement, quand deux groupes se présentent avec le même numéro de siège.
## Les personnes utilisatrices
| Profil | Ce qu'il fait | Rôle applicatif |
| :--- | :--- | :--- |
| **Organisateur** | Créer un événement, configurer le plan de la salle, suivre les ventes en direct, annuler une réservation en cas de problème | ```organisateur``` |
| **Spectateur** | Voir les événements à venir, choisir ses sièges sur un plan clair, réserver rapidement sans craindre de perdre son siège au profit de quelqu'un d'autre | ```spectateur``` |
---
## Proposition
**Seats** est une application web qui permet à un organisateur de vendre les places d'un événement sur un plan de salle interactif, et à un spectateur de réserver ses sièges en temps réel avec la certitude que sa réservation est définitive.
## Dans la portée
- Création d'un compte et connexion, avec un rôle organisateur ou spectateur attribué à l'inscription.
- Un organisateur peut créer un événement (titre, description, date, lieu) et lui associer un plan de salle (rangées et sièges, avec au besoin des sections à tarifs différents).
- Un spectateur peut parcourir la liste des événements à venir et consulter le plan de salle d'un événement.
- Un spectateur peut sélectionner un ou plusieurs sièges libres; le siège passe alors dans un état « en cours de sélection » visible par tous les autres spectateurs regardant le même plan, avec un délai limité pour confirmer.
- Confirmation de la réservation : le ou les sièges passent définitivement à l'état « réservé », associés au compte du spectateur.
- Si le délai de sélection expire sans confirmation, le ou les sièges redeviennent libres pour tout le monde.
- L'organisateur voit en direct l'état de vente de son événement (sièges vendus / disponibles) et peut annuler une réservation.
- Un spectateur peut consulter la liste de ses réservations et annuler une réservation à venir.
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
| 1 | Application client-serveur, cadriciel full stack SSR + CSR | Node.js, React, React Router v7 (mode framework) | Les pages (liste des événements, plan de salle, tableau de bord organisateur) sont rendues côté serveur au premier chargement, puis les interactions (sélection de siège, mise à jour en direct) sont gérées côté client. |
| 2 | Base de données transactionnelle | PostgreSQL | Toutes les opérations de réservation (verrouillage d'un siège, confirmation, expiration) passent par des transactions SQL pour garantir qu'un siège n'est jamais attribué à deux personnes. |
| 3 | Installation et démarrage via Docker | Docker + Docker Compose | Un seul `docker compose up` démarre l'application, la base de données et le service temps réel, sans installation locale de Node ou PostgreSQL. |
| 4 | Deux rôles d'utilisateur aux permissions réellement différentes | Authentification maison (courriel + mot de passe, ou OAuth2 dès qu'enseigné) | `organisateur` peut créer/modifier un événement et son plan de salle, voir les statistiques de vente, annuler des réservations. `spectateur` peut seulement consulter, réserver et annuler ses propres réservations. Ces permissions sont vérifiées côté serveur, pas seulement cachées dans l'interface. |
| 5 | Fonctionnalité temps réel multi-utilisateurs | Socket.IO (WebSockets) | Le plan de salle d'un événement est une vue partagée : dès qu'un siège change d'état (libre → en sélection → réservé, ou l'inverse en cas d'expiration), tous les spectateurs regardant ce plan voient le changement sans recharger la page. C'est le cœur de l'application, pas une fonctionnalité ajoutée en périphérie. |
| 6 | Point de concurrence réel | Transaction PostgreSQL avec contrainte d'unicité (`evenement_id`, `siege_id`) sur la table des réservations, ou verrouillage `SELECT ... FOR UPDATE` | Deux spectateurs cliquent sur le même siège au même instant : le serveur ne laisse passer qu'une seule confirmation. La seconde tentative reçoit un refus explicite et immédiat, et le client resynchronise l'affichage sur l'état réel du serveur. |
| 7 | Tests automatisés à chaque poussée | GitHub Actions | Une chaîne CI exécute les tests (au minimum : logique de réservation, y compris le scénario de double clic simultané) à chaque poussée sur le dépôt. |
| 8 | Déploiement sur un serveur | Serveur du département ou hébergeur externe (à préciser en cours de session) | L'application finale est accessible par une URL publique, pas seulement en local sur les portables de l'équipe. |
---
