# Suivi des risques — mise à jour du 29 octobre 2026 (fin du sprint 2)

| Risque | Statut au 29 octobre | Tendance |
|---|---|---|
| 1 — Docker fonctionne « chez nous » mais pas ailleurs | **Survenu** au sprint 1, pas revenu au sprint 2 | Probabilité en baisse |
| 2 — Retard sur un calendrier serré | **Survenu en partie** aux deux sprints : au sprint 2, 39 points sur 42, mais plusieurs récits finis les deux derniers jours | Toujours élevé pour le sprint 3 |
| 3 — Concurrence mal implémentée, doubles réservations | Pas survenu ; tests d'intégration étendus à l'annulation | Probabilité en baisse |
| 4 — Un changement d'API dans un dépôt casse l'autre | **Survenu** de nouveau au sprint 2 (#36) | Élevé |
| 5 — Base Supabase partagée désynchronisée des migrations | Atténué : les migrations s'appliquent au démarrage du backend, en local comme sur Render | En baisse |
| 6 — La connexion GitHub marche chez nous mais pas chez le correcteur | **Nouveau** (sprint 2) | Moyen |
| 7 — Plus aucun moyen de créer un organisateur | **Survenu** le 26 octobre (retrait de l'inscription), **résolu** le jour même en la remettant | Faible |
| 8 — Connexion Google ou Microsoft refusée au correcteur | **Nouveau** (sprint 2, #114) | Moyen |
| 9 — L'application en ligne (Render) est indisponible ou lente | **Nouveau**, survenu le 29 octobre (construction en échec), corrigé | Moyen |

Aucun risque n'a disparu. Le risque 7 est résolu, mais reste suivi jusqu'à l'écran de changement de rôle (#121). Le risque 3 est au cœur du sprint 3 (#15, #16).

# Risque 1 - Docker fonctionne « chez nous » mais pas ailleurs
- Probabilité : Moyenne — un docker-compose.yml qui fonctionne sur la machine d'un membre mais échoue sur une autre (dépendance système, chemin codé en dur, variable d'environnement oubliée) est fréquent.
- Impact : Moyen à élevé — l'énoncé exige explicitement que l'application démarre « sans que j'aie à installer quoi que ce soit d'autre »; un échec au point de contrôle ou à la correction nuit directement à l'objectif 5.
- Signal d'alerte : un membre de l'équipe ne parvient pas à démarrer l'application avec docker compose up à partir d'un clone neuf du dépôt.
- Mesure d'atténuation : tester docker compose up depuis un clone neuf (pas seulement un git pull sur une copie déjà configurée) avant chaque remise et chaque point de contrôle; cette vérification fait partie de la définition de « terminé » de 05-equipe.md.
- **Ce qui s'est produit (sprint 1)** : le signal d'alerte s'est déclenché trois fois.
  - Le 28 septembre, en testant le déploiement Docker pour le point de contrôle, `docker compose up` a échoué. Il a fallu corriger le `docker-compose.yml` et la construction de l'image.
  - Le même jour, `docker compose` ne pouvait pas construire l'image du backend depuis GitHub sans authentification, car les dépôts étaient privés. Les deux dépôts ont été rendus publics.
  - Le 1er octobre, le backend ne démarrait pas depuis un clone fait sous Windows, à cause des fins de ligne converties en CRLF. Un `.gitattributes` a été ajouté (Seats-Backend PR #20).
- **Atténuation en place** : un seul `docker compose up` démarre la base, le backend et le frontend, avec les migrations et des comptes de démonstration (Seats-Backend PR #15, Seats-Frontend PR #61). Le test depuis un clone neuf reste à faire avant chaque remise, idéalement sur un poste Windows **et** un poste macOS/Linux.
- **Sprint 2** : pas revenu. L'application a été reconstruite et démarrée avec `docker compose up --build` depuis `main` les 25 et 28 octobre, sous Windows ; il faut seulement `$env:COMPOSE_BAKE="false"`, déjà documenté dans le README.

# Risque 2 - Retard accumulé sur un calendrier serré
- Probabilité : Élevée — c'est le risque le plus classique d'un projet de session, et l'équipe a plusieurs autres évaluations/cours en parallèle.
- Impact : Moyen — un retard modéré se rattrape en coupant dans les récits should/could; un retard important sur les récits must compromet l'incrément démontrable d'un sprint.
- Signal d'alerte : à la fin du sprint 1, la vélocité réelle (points de récits réellement terminés selon la définition de « terminé ») est inférieure à 70 % de la capacité planifiée dans 04-sprints.md.
- Mesure d'atténuation : l'ordre d'abandon défini dans 04-sprints.md est appliqué sans négociation dès qu'un retard est constaté en mêlée; on ne commence pas un nouveau récit tant que le précédent ne respecte pas entièrement la définition de « terminé », pour éviter d'accumuler du travail à moitié fait sur plusieurs fronts.
- **Ce qui s'est produit (sprint 1)** : nous nous sommes engagés sur 39 points pour une capacité prudente estimée à 18. Au 1er octobre, les 15 récits ont du code fusionné dans `main` : l'ordre d'abandon n'a pas eu à être appliqué. Le risque s'est quand même manifesté autrement :
  - Une grande partie du travail a été fusionnée en fin de sprint : 20 PR sur les deux dépôts entre le 27 et le 30 septembre.
  - Plusieurs bogues n'ont été découverts qu'en testant l'application complète le 28 septembre, après la fusion : un siège en sélection affiché comme réservé, des sélections expirées qui bloquaient un siège, le formulaire d'événement qui ne chargeait plus les salles, l'absence de redirection après l'inscription.
  - Le critère « des tests automatisés couvrent le comportement ajouté » de la définition de « terminé » n'était donc pas toujours respecté au moment de la fusion.
- **Ajustement pour le sprint 2** : planifier sur la vélocité réellement observée, en ne comptant un récit que s'il respecte toute la définition de « terminé ». Tester le parcours complet dans Docker au milieu du sprint, pas seulement la veille du point de contrôle.
- **Ce qui s'est produit (sprint 2)** : 39 points livrés sur 42 engagés (37, plus #101 ajouté le 26 octobre). Le risque s'est encore manifesté en fin de sprint :
  - Sept PR ouvertes le 19 octobre ont attendu 6 à 7 jours leur revue, puis ont été fusionnées les 25 et 26 octobre, avec des conflits à résoudre.
  - #34 et #35 n'ont été fusionnés que les 28 et 29 octobre, la veille et le jour de la remise.
  - Seule la liste des organisateurs (3 points) est reportée : elle n'avait pas d'issue GitHub, donc pas de responsable.
- **Ajustement pour le sprint 3** : règle de protection de `main` avec approbation obligatoire, et relance au début de chaque bloc des PR qui attendent depuis plus de 24 h (voir la [rétrospective du sprint 2](retrospectives/sprint-2.md)). Vérifier en début de sprint que chaque récit engagé a son issue GitHub et un responsable.

# Risque 3 - Mécanisme de concurrence mal implémenté, doubles réservations possibles
- Probabilité : Moyenne — le verrouillage pessimiste et la contrainte d'unicité décrits dans 03-conception.md sont conceptuellement simples, mais une erreur d'implémentation (transaction mal délimitée, contrainte oubliée en migration) passe facilement inaperçue en test manuel.
- Impact : Élevé - compromet directement l'exigence 6 du cours (« point de concurrence réel »), qui est explicitement vérifiée lors de la correction.
- Signal d'alerte : un test automatisé simulant deux confirmations simultanées sur le même siège échoue (les deux réussissent, ou aucune ne réussit proprement), ou le bug est reproduit manuellement en ouvrant deux navigateurs.
- Mesure d'atténuation : écrire le test automatisé de double confirmation simultanée avant le sprint 3 plutôt qu'à la toute fin, et l'intégrer à la chaîne CI dès qu'il existe. Le récit #15 fait l'objet d'une revue de code obligatoire par au moins deux membres de l'équipe, pas seulement l'auteur.
- **Ce qui s'est produit (sprint 1)** : le risque ne s'est pas produit, et l'atténuation a commencé dès le sprint 1. La contrainte unique `(siegeId, evenementId)` est en base. Un test d'intégration la vérifie sous requêtes simultanées, contre un vrai PostgreSQL lancé dans la CI (#27, Seats-Backend PR #10 et #12). Il reste à couvrir l'expiration du délai de sélection (#15) et la resynchronisation des clients (#39) au sprint 3.
- **Sprint 2** : toujours pas survenu. L'annulation d'une réservation (#14) a changé la contrainte en `(siegeId, evenementId, actif)`, `actif` passant à NULL à l'annulation. Trois tests d'intégration le vérifient : un siège annulé peut être réservé de nouveau, de deux réservations simultanées une seule passe, et de deux annulations simultanées une seule s'applique (Seats-Backend PR #25). Côté temps réel, un siège en sélection par un autre est refusé (409) même par une requête directe à l'API (#31).

# Risque 4 - Un changement d'API dans un dépôt casse l'autre (nouveau)
- Probabilité : Élevée — le backend et le frontend sont dans deux dépôts séparés, avec chacun sa CI. Un changement de contrat (route protégée, champ renommé ou retiré) passe les tests d'un dépôt sans que l'autre le voie.
- Impact : Moyen — une page entière cesse de fonctionner jusqu'à ce que l'autre dépôt soit corrigé, souvent découvert seulement en testant l'application complète.
- **Déjà survenu** :
  - Le 28 septembre, `GET /api/salles` est devenu authentifié côté backend (#25). Le formulaire de création d'événement, qui appelait cette route sans jeton, n'affichait plus aucune salle.
  - Le 1er octobre, la sécurisation des routes organisateur a demandé des PR coordonnées dans les deux dépôts (Seats-Frontend PR #77, Seats-Backend PR #21), avec des conflits à résoudre des deux côtés.
- Signal d'alerte : une PR backend modifie une route, un middleware d'authentification ou la forme d'une réponse sans PR frontend associée.
- Mesure d'atténuation : toute PR qui change le contrat de l'API mentionne la PR correspondante de l'autre dépôt, et les deux sont fusionnées ensemble. La table des routes du README du backend est mise à jour dans la même PR.
- **Ce qui s'est produit (sprint 2)** : le frontend de #36 (Seats-Frontend PR #98) a été fusionné le 26 octobre à 0 h 35, alors que son backend (Seats-Backend PR #31) ne l'a été qu'à 18 h 56. Pendant ce temps, l'écran de supervision appelait `GET /api/admin/evenements`, une route qui n'existait pas encore. La même PR backend cassait aussi 3 tests de `main` parce que #11 avait changé le calcul des ventes entre-temps, corrigé par Seats-Backend PR #38.

# Risque 5 - Base Supabase partagée désynchronisée des migrations (nouveau)
- Probabilité : Moyenne — toute l'équipe développe contre la même base Supabase, et une migration Prisma ajoutée dans une branche n'y est appliquée qu'à la main.
- Impact : Moyen — l'application de tous les membres échoue (colonne inexistante) tant que la migration n'est pas appliquée, ou une migration appliquée trop tôt casse le code des autres branches.
- **Déjà survenu** : le 21 septembre, la création d'un événement échouait tant que les migrations ajoutant l'affiche et le tarif n'étaient pas appliquées à la base partagée.
- Signal d'alerte : une PR ajoute un dossier dans `prisma/migrations` ; un membre obtient une erreur Prisma sur une colonne ou une table inconnue.
- Mesure d'atténuation : développer en local contre le PostgreSQL du `docker compose`, où les migrations sont appliquées au démarrage. Appliquer une migration à Supabase seulement après la fusion de sa PR dans `main`, et l'annoncer à la mêlée suivante.
- **Sprint 2** : quatre migrations ajoutées (`annuler_reservation`, `sections_tarifaires`, `connexion_github`, `identite_externe_oidc`), sans incident. Depuis le déploiement sur Render (#19, 29 octobre), le backend applique lui-même les migrations à Supabase à chaque démarrage : il n'y a plus d'étape manuelle après une fusion.

# Risque 6 - La connexion GitHub marche chez nous mais pas chez le correcteur
- Probabilité : Moyenne — la connexion dépend de valeurs hors du dépôt (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` dans le `.env`) et d'une URL de callback qui doit correspondre exactement à celle de l'OAuth App.
- Impact : Élevé — la connexion GitHub avec un compte inconnu de l'application fait partie du niveau « Acquis » de l'objectif 1 de la bêta.
- Signal d'alerte : depuis un clone neuf, le bouton « Continuer avec GitHub » mène à une erreur (`redirect_uri` refusée, connexion non configurée) ou revient sur la page de connexion avec un message d'erreur.
- Mesure d'atténuation : `.env.example` à la racine du dépôt (à côté de `compose.yml`) qui liste chaque variable ; callback fixé à `http://localhost:3000/api/auth/github/callback` et documenté dans le README ; test depuis un clone neuf avec un compte GitHub qui ne s'est jamais connecté ; `.env` complet envoyé par MIO avant l'échéance.

# Risque 7 - Plus aucun moyen de créer un organisateur
- Probabilité : Faible depuis que l'inscription est revenue — elle permet de choisir le rôle organisateur.
- Impact : Moyen — sans moyen de devenir organisateur, seul le compte de démonstration `organisateur@seats.demo` peut créer des salles et des événements.
- Signal d'alerte : un utilisateur connecté avec GitHub, Google ou Microsoft (toujours `spectateur`) veut organiser un événement.
- **Ce qui s'est produit (sprint 2)** : le 26 octobre, l'inscription a été retirée au profit de la connexion GitHub ; plus aucun nouvel utilisateur ne pouvait devenir organisateur. L'inscription a été remise le jour même, à côté des boutons de connexion externe.
- Mesure d'atténuation restante : un écran administrateur pour changer le rôle d'un compte créé par un fournisseur externe (#121, sprint 3).

# Risque 8 - Connexion Google ou Microsoft refusée au correcteur
- Probabilité : Moyenne — plusieurs réglages hors du code peuvent bloquer un compte qui n'appartient pas à l'équipe.
- Impact : Faible à moyen — #114 est un `Could` ; la connexion GitHub reste la méthode exigée.
- Signal d'alerte :
  - Google : « Accès bloqué : l'application n'a pas terminé la procédure de validation » (application restée en mode « Test ») ;
  - Microsoft : « Approbation de l'administrateur requise » avec un compte d'organisation (cégep), ou « secret client expiré ».
- Mesure d'atténuation : publier l'application Google (pages d'accueil et de confidentialité sur GitHub) ; inscrire l'application Microsoft pour les comptes personnels **et** professionnels ; noter la date d'expiration du secret Microsoft (180 jours) et le renouveler avant ; un fournisseur non configuré reste affiché « Bientôt » plutôt que de mener à une erreur.

# Risque 9 - L'application en ligne (Render) est indisponible ou lente (nouveau)
- Probabilité : Moyenne — l'offre gratuite de Render met un service en veille après 15 minutes sans visite, et limite la mémoire disponible pour construire les images à 512 Mo.
- Impact : Moyen — l'adresse publique est exigée (#19) ; une page qui met une minute à répondre, ou un déploiement en échec, se voit tout de suite pendant une correction ou une démonstration.
- Signal d'alerte : un déploiement Render en rouge après une fusion dans `main` ; un premier chargement de 30 à 60 secondes.
- **Déjà survenu** : le 29 octobre, la construction du frontend dépassait les 512 Mo de Render et échouait. Elle a été corrigée le jour même (Seats-Frontend PR #131).
- Mesure d'atténuation : ouvrir les deux adresses (frontend et backend) une minute avant une démonstration ou une correction ; vérifier dans Render que le déploiement de chaque fusion est vert ; garder `docker compose up` comme solution de repli en local.
