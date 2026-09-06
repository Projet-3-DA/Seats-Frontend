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
