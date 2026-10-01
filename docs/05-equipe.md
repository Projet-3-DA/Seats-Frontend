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

## Soumission (sprint 0)

| Membre | Contributions à la soumission |
|---|---|
| Oladé | J'ai rédigé les récits utilisateurs, créé et rempli les issues GitHub, ajouté les labels, organisé le tableau Kanban, et contribué aux autres livrables de l'équipe |
| Yanis | J'ai fait le [README](../README.md), [vision.md](01-vision.md), [equipe.md](05-equipe.md) et [risques.md](06-risques.md) |
| Glodie | J'ai fait le [conception.md](03-conception.md), le diagramme, ainsi que les maquettes
| Delavie | J'ai fait le [backlog.md](02-backlog.md) et [sprints.md](04-sprints.md) |

## Sprint 1

Établi à partir de l'historique Git des deux dépôts au 1er octobre 2026. Une PR est attribuée à la personne qui en a écrit les commits, pas à celle qui l'a fusionnée. `B#n` renvoie à une PR de [Seats-Backend](https://github.com/Projet-3-DA/Seats-Backend/pulls), `F#n` à une PR de [Seats-Frontend](https://github.com/Projet-3-DA/Seats-Frontend/pulls).

| Membre | Récits (points) et PR | Points | Autres réalisations |
|---|---|:---:|---|
| Yanis | #2 Créer une salle (3) — [B#1](https://github.com/Projet-3-DA/Seats-Backend/pull/1), [F#47](https://github.com/Projet-3-DA/Seats-Frontend/pull/47)<br>#25 Voir la liste de mes salles (2) — [B#14](https://github.com/Projet-3-DA/Seats-Backend/pull/14), [F#59](https://github.com/Projet-3-DA/Seats-Frontend/pull/59)<br>#4 Voir la liste des événements à venir (3) — [F#43](https://github.com/Projet-3-DA/Seats-Frontend/pull/43), [F#60](https://github.com/Projet-3-DA/Seats-Frontend/pull/60) | 8 | Structure du backend (routage, variables d'environnement, architecture contrôleur-service, CORS) et du frontend Expo ; Dockerfile et workflow de construction des images ([B#7](https://github.com/Projet-3-DA/Seats-Backend/pull/7), [F#50](https://github.com/Projet-3-DA/Seats-Frontend/pull/50)) ; correctifs `docker compose` et redirection vers la connexion après inscription ([F#68](https://github.com/Projet-3-DA/Seats-Frontend/pull/68)) ; `.gitattributes` pour que le backend démarre depuis un clone Windows ([B#20](https://github.com/Projet-3-DA/Seats-Backend/pull/20)) ; fusion des PR prêtes le 28 septembre. |
| Glodie | #1 Créer un compte (3) — [B#5](https://github.com/Projet-3-DA/Seats-Backend/pull/5), [F#45](https://github.com/Projet-3-DA/Seats-Frontend/pull/45)<br>#7 Voir mes réservations (3) — [B#18](https://github.com/Projet-3-DA/Seats-Backend/pull/18), [F#70](https://github.com/Projet-3-DA/Seats-Frontend/pull/70)<br>#26 Refuser une réservation si un siège a été pris entretemps (3) — [B#19](https://github.com/Projet-3-DA/Seats-Backend/pull/19), [F#71](https://github.com/Projet-3-DA/Seats-Frontend/pull/71) | 9 | Correctif de la barre de navigation : « Se connecter » au lieu du profil quand on est déconnecté, #42 ([F#73](https://github.com/Projet-3-DA/Seats-Frontend/pull/73)) ; mise à jour de [conception.md](03-conception.md) pour l'aligner sur le code (routes, modèle de données). |
| Delavie | #28 Se connecter et maintenir ma session (2) — [B#11](https://github.com/Projet-3-DA/Seats-Backend/pull/11), [F#54](https://github.com/Projet-3-DA/Seats-Frontend/pull/54)<br>#5 Afficher le plan de salle avec l'état des sièges (3) — [B#3](https://github.com/Projet-3-DA/Seats-Backend/pull/3), [F#46](https://github.com/Projet-3-DA/Seats-Frontend/pull/46)<br>#24 Générer et afficher le plan de sièges (3) — [B#13](https://github.com/Projet-3-DA/Seats-Backend/pull/13), [F#58](https://github.com/Projet-3-DA/Seats-Frontend/pull/58)<br>#30 Empêcher la sélection d'un siège déjà réservé (2) — [B#17](https://github.com/Projet-3-DA/Seats-Backend/pull/17) | 10 | Scrum Master du sprint 1 ; création de salles, d'événements et envoi d'affiches réservés aux organisateurs, avec redirection de `/organisateur` vers la connexion ([F#77](https://github.com/Projet-3-DA/Seats-Frontend/pull/77), [B#21](https://github.com/Projet-3-DA/Seats-Backend/pull/21) en revue) ; README du backend (même PR [B#21](https://github.com/Projet-3-DA/Seats-Backend/pull/21)). |
| Junior | #3 Créer un événement (3) et #29 Attribuer une salle existante (2) — [B#2](https://github.com/Projet-3-DA/Seats-Backend/pull/2), [B#4](https://github.com/Projet-3-DA/Seats-Backend/pull/4), [F#44](https://github.com/Projet-3-DA/Seats-Frontend/pull/44), [F#48](https://github.com/Projet-3-DA/Seats-Frontend/pull/48)<br>#6 Réserver un ou plusieurs sièges (3) — [B#12](https://github.com/Projet-3-DA/Seats-Backend/pull/12), [B#16](https://github.com/Projet-3-DA/Seats-Backend/pull/16), [F#55](https://github.com/Projet-3-DA/Seats-Frontend/pull/55), [F#63](https://github.com/Projet-3-DA/Seats-Frontend/pull/63)<br>#27 Garantir l'unicité en base contre les réservations concurrentes (2) — [B#10](https://github.com/Projet-3-DA/Seats-Backend/pull/10), [B#12](https://github.com/Projet-3-DA/Seats-Backend/pull/12)<br>#42 Barre de navigation commune (2) — [F#56](https://github.com/Projet-3-DA/Seats-Frontend/pull/56) | 12 | Configuration de Prisma et Supabase ; tests automatisés et intégration continue GitHub Actions ([B#8](https://github.com/Projet-3-DA/Seats-Backend/pull/8), [B#9](https://github.com/Projet-3-DA/Seats-Backend/pull/9), [F#49](https://github.com/Projet-3-DA/Seats-Frontend/pull/49), [F#51](https://github.com/Projet-3-DA/Seats-Frontend/pull/51), [F#52](https://github.com/Projet-3-DA/Seats-Frontend/pull/52), [F#53](https://github.com/Projet-3-DA/Seats-Frontend/pull/53)) ; démarrage complet avec `docker compose` depuis un clone neuf, migrations et comptes de démonstration ([B#15](https://github.com/Projet-3-DA/Seats-Backend/pull/15), [F#61](https://github.com/Projet-3-DA/Seats-Frontend/pull/61)) ; correctifs : tarif gratuit ([F#62](https://github.com/Projet-3-DA/Seats-Frontend/pull/62)), pas de retour vers la connexion une fois authentifié ([F#66](https://github.com/Projet-3-DA/Seats-Frontend/pull/66)), salles chargées avec le jeton ([F#67](https://github.com/Projet-3-DA/Seats-Frontend/pull/67)) ; tenue du [journal](journal.md) ([F#69](https://github.com/Projet-3-DA/Seats-Frontend/pull/69), [F#72](https://github.com/Projet-3-DA/Seats-Frontend/pull/72)). |
| **Total** | 15 récits | **39** | |
