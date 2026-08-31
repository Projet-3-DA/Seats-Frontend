# Rôles
| **Sprint** | **Scrum Master** |
| :---: | :--- |
| 1 | Delavie |
| 2 | Yanis |
| 3 | Glodie |
---

# Rituels

- **Mêlée** : Au début de chaque cours pendant 10 minutes
- **Planification** : pendant le premier bloc de cours de chaque sprint
- **Revue** : au dernier bloc de chaque sprint, incrément démontré au professeur.
- **Rétrospective** : après la revue, pendant 30 minutes; on en sort avec un changement précis, assigné à quelqu'un, vérifié à la rétrospective suivante.

# Définition de « terminé »

Un récit est terminé quand :

- le code est fusionné dans `main` par une demande de tirage revue par un
  coéquipier;
- l'intégration continue est verte;
- des tests automatisés couvrent le comportement ajouté, cas d'erreur inclus;
- tous les critères d'acceptation du récit sont satisfaits;
- l'application démarre à partir d'un clone neuf;
- la documentation utilisateur est à jour si le récit change l'interface.

# Conventions

### Convention de nommage des branches
type/numero-issue-description-courte
**Exemples**
feature/12-plan-salle-interactif
feature/8-auth-inscription-jwt
bug/23-timer-expiration-siege
chore/5-setup-docker-compose

Les types correspondent aux labels :
- feature/ — nouvelle fonctionnalité
- bug/ — correction

Les règles :
- Tout en minuscules
- Tirets à la place des espaces
- Le numéro d'issue en premier — ça permet de retrouver la branche depuis l'issue GitHub et vice versa
- Description courte, 3-5 mots max

Les branches protégées que l'équipe ne touche jamais directement :
- main — production

### Format des messages de commit
Les types :
- feat — nouvelle fonctionnalité
- fix — correction de bug
- chore — tâche technique
- test — ajout ou modification de tests
- docs — documentation
- refactor — restructuration sans changement de comportement
- style — formatage, lint (pas de logique)
Les règles :
- Verbe à l'infinitif, pas au passé (ajouter pas ajouté)
- Maximum 72 caractères
- Le scope entre parenthèses correspond à tes labels de domaine (auth, ui, realtime, booking)
- Jamais de fix stuff, wip, update seul — trop vague

**Exemple de message**: feat(auth): Ajouter endpoint POST /register

### Règles de revue de code

Avant d'ouvrir la PR :
- La branche est à jour avec develop (rebase ou merge)
- Les tests passent localement
- Pas de console.log oubliés
- Le titre de la PR reprend le nom de l'issue + Closes #N dans la description

Le reviewer doit vérifier :
- La logique métier correspond aux critères d'acceptation de l'issue
- Pas de duplication de code évidente
- Les cas limites sont gérés (ex : que se passe-t-il si le siège est déjà pris ?)
- Les noms de variables/fonctions sont clairs

Ce que le reviewer ne doit PAS faire :
- Bloquer pour du style (indentation, espaces) — c'est le rôle du linter/prettier
- Réécrire le code de l'autre à sa place
- Approuver sans avoir lu

Les règles de l'équipe à décider ensemble :
- Minimum 1 approbation avant de merger (idéalement 2 sur les features critiques comme realtime et booking)
- L'auteur de la PR ne merge jamais lui-même sans approbation
- Un commentaire de review doit être résolu avant le merge — pas ignoré
- Délai max pour reviewer : 24h pour ne pas bloquer l'avancement des autres

# Journal

Le journal est tenu dans [journal.md](journal.md) une entrée par bloc de cours

# Contributions individuelles

| Membre | Contributions à la soumission |
|---|---|
| Oladé | J'ai rédigé les récits utilisateurs, créé et rempli les issues GitHub, ajouté les labels, organisé le tableau Kanban, et contribué aux autres livrables de l'équipe |
| Yanis | J'ai fait le [README](../README.md), [vision.md](01-vision.md), [equipe.md](05-equipe.md) et [risques.md](06-risques.md) |
| Glodie | J'ai fait le [conception.md](03-conception.md), le diagramme, ainsi que les maquettes
| Delavie | J'ai fait le [backlog.md](02-backlog.md) et [sprints.md](04-sprints.md) |
