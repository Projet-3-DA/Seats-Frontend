# Journal de sprint 0

## Bloc 2 — lundi 24 août
- **Présences** : Junior, Delavie, Glodie, Yanis.
- **Avancé** : vision.md complété, conception.md complété
- **Blocage** : on hésitait sur le rôle de salle.
- **Décisions** : création d'une entité salle qui sera attribuée à un événement.

## Bloc 3 — jeudi 27 août
- **Présences** : Junior, Delavie, Glodie, Yanis.
- **Avancé** : point de contrôle 1 validé, equipe.md complété
- **Blocage** : recherche sur les conventions de nommage des branches et des messages de commit.
- **Décisions** :
  - Adoption de la convention Conventional Commits pour les messages de commit (`feat`, `fix`, `chore`, `test`, `docs`, `refactor`).
  - Adoption de la convention `type/numero-issue-description-courte` pour le nommage des branches.
  - Branches protégées : `main` (production) et `develop` (intégration) — aucun push direct autorisé.
  - Règle 1 issue = 1 branche = 1 PR établie pour toute l'équipe.
  - Minimum 1 approbation requise avant tout merge sur `develop`, l'auteur ne peut pas approuver sa propre PR.
  - Suppression de la branche après chaque merge.
  - Configuration du projet GitHub Projects avec les colonnes : Backlog, En cours, En révision, Terminé.
  - Labels retenus : `feature`, `bug`, `chore`, `blocked`, `auth`, `ui`, `realtime`, `booking`, `devops`.

## Bloc 4 — Jeudi 3 septembre
- **Présences** : Junior, Delavie, Glodie, Yanis.
- **Avancé** : backlog révisé (subdivision des récits à 5 et 8 points), maquettes validées, schéma de la base de données complété.
- **Blocage** :
  - Désaccord sur la plateforme par laquelle commencer (mobile ou web).
  - Désaccord sur la séparation du nouveau backlog par domaine technique (front-end / back-end distincts dans le tableau Kanban).
- **Décisions** :
  - Développement de deux clients : une application mobile (React Native) et une application web (React).
  - On commence par le mobile.
  - La séparation front-end/back-end dans le Kanban est désapprouvée — chaque équipier prend une tâche entière (front + back) plutôt que de se spécialiser par couche technique.

# Journal de sprint 1

## Lundi 21 septembre
- **Présences** : Junior, Delavie, Glodie, Yanis.
- **Avancé** :
  - Terminé (fusionné dans `main`) :
    - #4 — Voir la liste des événements à venir, par Yanis (PR #43, frontend).
    - #2 — Créer une salle, par Yanis : création avec génération des sièges (PR #1, backend) ; la page de création de salle est déjà dans `main` côté frontend, avec son correctif de saisie (lettres refusées dans les champs de rangées et de colonnes, PR #47).
    - #3 et #29 — Créer un événement et lui attribuer une salle existante, par Junior (PR #44 frontend, PR #2 backend) : formulaire avec affiche (fichier ou lien), le fichier étant envoyé vers Supabase Storage.
  - En révision (branches poussées, en attente de fusion) :
    - #3 et #29 (suite), par Junior — tarif de la place et image aléatoire par défaut quand aucune affiche n'est fournie (`feature/3-creer-evenement-attribuer-salle`, backend et frontend).
    - #5 — Afficher le plan de salle avec l'état des sièges, par Delavie (`feature/5-plan-salle`, backend et frontend).
    - #1 — Créer un compte, par Glodie : page d'inscription avec validation de l'email et du mot de passe (`feature/1-créer-un-compte`, frontend seulement pour l'instant).
- **Blocage** :
  - Le schéma initial ne prévoyait ni affiche ni tarif pour un événement (le tarif figure pourtant dans la maquette du formulaire de création).
  - Tant que les migrations Prisma n'étaient pas appliquées à la base Supabase partagée, la création d'un événement échouait (colonne inexistante).
- **Décisions** :
  - Modifications de la base de données (migrations Prisma) :
    - `Evenement.afficheUrl` (texte, facultatif) : la base ne garde que l'adresse de l'affiche ; un fichier choisi est envoyé sur Supabase Storage (bucket public `affiches`), un lien est enregistré tel quel.
    - `Evenement.tarif` (`Decimal(8,2)`, tarif unique de la place en $ CAD) : obligatoire à la création (0 si gratuit) ; les événements existants gardent un tarif vide.
    - La fonctionnalité brouillon (statut, salle et date facultatives) a été envisagée puis abandonnée : seul le tarif est conservé.
  - Une seule application Expo (React Native, avec le web via react-native-web) qui tourne sur toutes les plateformes (web, iOS et Android), au lieu de deux clients séparés (React Native puis React web). Cette décision remplace celle du bloc 4.

## Lundi 28 septembre
- **Présences** : Glodie, Junior, Yanis.
- **Avancé** :
  - Déploiement de toute l'application avec Docker (Junior, backend PR #15 et frontend PR #61) : `docker compose up` démarre la base de données, le backend et le frontend en une seule commande depuis un clone neuf, avec migrations Prisma et comptes de démonstration (un par rôle) créés automatiquement au démarrage.
  - Yanis a corrigé plusieurs problèmes rencontrés en testant ce déploiement (`docker-compose.yml`, construction de l'image), redirigé l'utilisateur vers la page de connexion après la création d'un compte (bug trouvé en testant le parcours complet), et fusionné dans `main` l'ensemble des PR prêtes de la journée (#15, #16, #56, #61, #62, #63, #64, #65).
  - #6, #26, #27 — Réserver un ou plusieurs sièges et garantir l'unicité en base, par Junior : ajout d'une étape « Confirmer » avant l'enregistrement (auparavant, aucun écran ni endpoint ne confirmait la réservation, qui restait bloquée 15 minutes sans jamais s'afficher comme réservée).
  - Barre de navigation adaptée au rôle (spectateur / organisateur), par Junior : onglets « Salles » et « Mes événements » avec bouton de création, affichage corrigé sur mobile (libellés coupés), et protection empêchant un retour arrière vers la page de connexion une fois authentifié.
- **Blocage** :
  - En testant l'application déployée, plusieurs bugs ont été détectés et corrigés dans la journée :
    - Un siège en sélection non expiré s'affichait à tort comme réservé (plutôt que bloqué) dans le plan de salle — corrigé par Delavie (#30).
    - D'anciennes réservations en sélection jamais confirmées bloquaient définitivement un siège que le plan affichait pourtant comme libre — corrigé par Junior.
    - Le formulaire de création d'événement avait cessé de charger les salles disponibles (appel à l'API sans le jeton d'authentification désormais requis) — corrigé par Junior.
    - Après la création d'un compte, l'utilisateur n'était pas redirigé vers la connexion — corrigé par Yanis.
- **Décisions** :
  - Passage des deux dépôts (Seats-Backend et Seats-Frontend) en visibilité publique, pour que `docker compose` puisse construire l'image du backend depuis son URL GitHub sans authentification — exigé par la grille d'évaluation (un correcteur qui n'a que Docker installé).
  - Pas de tag `alpha-v1` pour le point de contrôle du jour : seule une application fonctionnelle via Docker était exigée, le tag reste pour la remise finale du sprint.

## Mercredi 30 septembre
- **Présences** : Delavie, Glodie, Junior, Yanis.
- **Avancé** :
  - #30 — Empêcher la sélection d'un siège déjà réservé, par Delavie (backend PR #17, mergée) : le plan de salle compte désormais les réservations « en_selection » non expirées comme sièges indisponibles, pas seulement celles confirmées.
  - #7 — Voir mes réservations, par Glodie (backend PR #18, frontend PR #70) : écran des billets, regroupés par événement et par statut (à venir, terminé, annulé), avec l'affiche de l'événement.
  - #26 — Refuser une réservation si un siège a été pris entretemps, par Glodie (backend PR #19, frontend PR #71).
- **Décisions** :
  - Clarification du périmètre entre #26 et #30, qui concernent tous deux un conflit sur un siège mais à des moments différents : #26 agit **au moment de la confirmation** (le siège visé vient d'être pris juste avant que la réservation ne soit enregistrée, la contrainte unique en base le détecte) ; #30 agit **pendant la sélection**, en empêchant de choisir un siège déjà pris par quelqu'un d'autre avant même de tenter de réserver.

## Jeudi 1er octobre
- **Présences** : Delavie, Glodie, Junior, Yanis.
- **Avancé** :
  - Yanis a testé et revu les PR entrantes avant leur fusion (frontend #66, #67, #72 à #76, #78 à #81, #83 ; backend #21, #22), corrigé les fins de ligne du script de démarrage du backend pour qu'il démarre sous Docker depuis un clone Windows (backend PR #20, `.gitattributes`), et rempli `04-sprints.md` (responsables des récits et bilan du sprint).
  - Glodie a corrigé des bugs de connexion et de réservation : l'onglet affiche « Se connecter » au lieu du profil quand on est déconnecté (PR #73), le formulaire de connexion se soumet avec la touche Entrée (PR #76), et le bouton « Réserver à nouveau » est caché pour un événement terminé (PR #81). Il a aussi mis à jour `03-conception.md`.
  - #82 — Masquer les événements passés et refuser leur réservation, par Junior (backend PR #22, frontend PR #83) : la liste ne montre plus que les événements à venir, le serveur refuse la réservation d'un événement passé, et la page d'un événement terminé l'indique.
  - Junior a aussi corrigé le rafraîchissement de la liste des événements après une création (PR #74), simplifié le démarrage Docker à un seul dépôt (PR #75), ramené dans `main` les correctifs de la barre d'onglets (PR #80) et rédigé le compte rendu de la rétrospective (PR #79).
  - Delavie a protégé les routes réservées aux organisateurs (backend PR #21, frontend PR #77), rédigé le README du backend (PR #21), et rempli `05-equipe.md` et `06-risques.md` (PR #78).
  - Rétrospective du sprint 1 tenue en fin de bloc (`docs/retrospectives/sprint-1.md`).
- **Décisions** :
  - Un seul dépôt à cloner, le frontend : `compose.yml` construit l'image du backend directement depuis l'URL GitHub de Seats-Backend, plutôt que d'exiger deux dépôts clonés côte à côte. La commande qui remplaçait `docker-entrypoint.sh` est retirée, pour que les comptes de démonstration soient bien créés.
  - Ajout de l'issue #82 : une requête directe à l'API (par exemple avec `curl`) permettait de réserver un événement terminé. Masquer le bouton ne suffit pas, la validation doit se faire côté serveur.
