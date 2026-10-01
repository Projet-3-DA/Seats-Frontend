# Suivi des risques — mise à jour du 1er octobre 2026 (sprint 1)

| Risque | Statut au 1er octobre | Tendance |
|---|---|---|
| 1 — Docker fonctionne « chez nous » mais pas ailleurs | **Survenu**, atténué | Probabilité en baisse |
| 2 — Retard sur un calendrier serré (39 pts pour ~18 estimés) | **Survenu en partie** : récits livrés, mais avec des régressions découvertes tard | Toujours élevé pour le sprint 2 |
| 3 — Concurrence mal implémentée, doubles réservations | Pas survenu ; atténuation commencée plus tôt que prévu | Probabilité en baisse |
| 4 — Un changement d'API dans un dépôt casse l'autre | **Nouveau**, déjà survenu deux fois | Élevé |
| 5 — Base Supabase partagée désynchronisée des migrations | **Nouveau**, survenu une fois | Moyen |

Aucun risque n'a disparu. Les risques 1 et 3 restent suivis : le premier peut revenir à chaque changement du `docker-compose.yml`, le second est au cœur du sprint 3.

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

# Risque 3 - Mécanisme de concurrence mal implémenté, doubles réservations possibles
- Probabilité : Moyenne — le verrouillage pessimiste et la contrainte d'unicité décrits dans 03-conception.md sont conceptuellement simples, mais une erreur d'implémentation (transaction mal délimitée, contrainte oubliée en migration) passe facilement inaperçue en test manuel.
- Impact : Élevé - compromet directement l'exigence 6 du cours (« point de concurrence réel »), qui est explicitement vérifiée lors de la correction.
- Signal d'alerte : un test automatisé simulant deux confirmations simultanées sur le même siège échoue (les deux réussissent, ou aucune ne réussit proprement), ou le bug est reproduit manuellement en ouvrant deux navigateurs.
- Mesure d'atténuation : écrire le test automatisé de double confirmation simultanée avant le sprint 3 plutôt qu'à la toute fin, et l'intégrer à la chaîne CI dès qu'il existe. Le récit #15 fait l'objet d'une revue de code obligatoire par au moins deux membres de l'équipe, pas seulement l'auteur.
- **Ce qui s'est produit (sprint 1)** : le risque ne s'est pas produit, et l'atténuation a commencé dès le sprint 1. La contrainte unique `(siegeId, evenementId)` est en base. Un test d'intégration la vérifie sous requêtes simultanées, contre un vrai PostgreSQL lancé dans la CI (#27, Seats-Backend PR #10 et #12). Il reste à couvrir l'expiration du délai de sélection (#15) et la resynchronisation des clients (#39) au sprint 3.

# Risque 4 - Un changement d'API dans un dépôt casse l'autre (nouveau)
- Probabilité : Élevée — le backend et le frontend sont dans deux dépôts séparés, avec chacun sa CI. Un changement de contrat (route protégée, champ renommé ou retiré) passe les tests d'un dépôt sans que l'autre le voie.
- Impact : Moyen — une page entière cesse de fonctionner jusqu'à ce que l'autre dépôt soit corrigé, souvent découvert seulement en testant l'application complète.
- **Déjà survenu** :
  - Le 28 septembre, `GET /api/salles` est devenu authentifié côté backend (#25). Le formulaire de création d'événement, qui appelait cette route sans jeton, n'affichait plus aucune salle.
  - Le 1er octobre, la sécurisation des routes organisateur a demandé des PR coordonnées dans les deux dépôts (Seats-Frontend PR #77, Seats-Backend PR #21), avec des conflits à résoudre des deux côtés.
- Signal d'alerte : une PR backend modifie une route, un middleware d'authentification ou la forme d'une réponse sans PR frontend associée.
- Mesure d'atténuation : toute PR qui change le contrat de l'API mentionne la PR correspondante de l'autre dépôt, et les deux sont fusionnées ensemble. La table des routes du README du backend est mise à jour dans la même PR.

# Risque 5 - Base Supabase partagée désynchronisée des migrations (nouveau)
- Probabilité : Moyenne — toute l'équipe développe contre la même base Supabase, et une migration Prisma ajoutée dans une branche n'y est appliquée qu'à la main.
- Impact : Moyen — l'application de tous les membres échoue (colonne inexistante) tant que la migration n'est pas appliquée, ou une migration appliquée trop tôt casse le code des autres branches.
- **Déjà survenu** : le 21 septembre, la création d'un événement échouait tant que les migrations ajoutant l'affiche et le tarif n'étaient pas appliquées à la base partagée.
- Signal d'alerte : une PR ajoute un dossier dans `prisma/migrations` ; un membre obtient une erreur Prisma sur une colonne ou une table inconnue.
- Mesure d'atténuation : développer en local contre le PostgreSQL du `docker compose`, où les migrations sont appliquées au démarrage. Appliquer une migration à Supabase seulement après la fusion de sa PR dans `main`, et l'annoncer à la mêlée suivante.
