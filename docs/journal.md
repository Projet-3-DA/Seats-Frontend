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
    - #4 — Voir la liste des événements à venir (PR #43, frontend).
    - #2 — Créer une salle : création avec génération des sièges (PR #1, backend) ; la page de création de salle est déjà dans `main` côté frontend.
    - #3 et #29 — Créer un événement et lui attribuer une salle existante (PR #44 frontend, PR #2 backend) : formulaire avec affiche (fichier ou lien), le fichier étant envoyé vers Supabase Storage.
  - En révision (branches poussées, en attente de fusion) :
    - #3 et #29 (suite) — tarif de la place et image aléatoire par défaut quand aucune affiche n'est fournie (`feature/3-creer-evenement-attribuer-salle`, backend et frontend).
    - #5 — Afficher le plan de salle avec l'état des sièges (`feature/5-plan-salle`, backend et frontend).
    - #1 — Créer un compte : page d'inscription avec validation de l'email et du mot de passe (`feature/1-créer-un-compte`, frontend seulement pour l'instant).
    - #2 (correctif) — Empêcher la saisie de lettres dans les champs de rangées et de colonnes (`feature/2-page-creation-de-salles`).
- **Blocage** :
  - Le schéma initial ne prévoyait ni affiche ni tarif pour un événement (le tarif figure pourtant dans la maquette du formulaire de création).
  - Tant que les migrations Prisma n'étaient pas appliquées à la base Supabase partagée, la création d'un événement échouait (colonne inexistante).
- **Décisions** :
  - Modifications de la base de données (migrations Prisma) :
    - `Evenement.afficheUrl` (texte, facultatif) : la base ne garde que l'adresse de l'affiche ; un fichier choisi est envoyé sur Supabase Storage (bucket public `affiches`), un lien est enregistré tel quel.
    - `Evenement.tarif` (`Decimal(8,2)`, tarif unique de la place en $ CAD) : obligatoire à la création (0 si gratuit) ; les événements existants gardent un tarif vide.
    - La fonctionnalité brouillon (statut, salle et date facultatives) a été envisagée puis abandonnée : seul le tarif est conservé.
  - Une seule application Expo (React Native, avec le web via react-native-web) qui tourne sur toutes les plateformes (web, iOS et Android), au lieu de deux clients séparés (React Native puis React web). Cette décision remplace celle du bloc 4.
