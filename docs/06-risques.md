# Risque 1 - Docker fonctionne « chez nous » mais pas ailleurs
- Probabilité : Moyenne — un docker-compose.yml qui fonctionne sur la machine d'un membre mais échoue sur une autre (dépendance système, chemin codé en dur, variable d'environnement oubliée) est fréquent.
- Impact : Moyen à élevé — l'énoncé exige explicitement que l'application démarre « sans que j'aie à installer quoi que ce soit d'autre »; un échec au point de contrôle ou à la correction nuit directement à l'objectif 5.
- Signal d'alerte : un membre de l'équipe ne parvient pas à démarrer l'application avec docker compose up à partir d'un clone neuf du dépôt.
- Mesure d'atténuation : tester docker compose up depuis un clone neuf (pas seulement un git pull sur une copie déjà configurée) avant chaque remise et chaque point de contrôle; cette vérification fait partie de la définition de « terminé » de 05-equipe.md.
# Risque 2 - Retard accumulé sur un calendrier serré
- Probabilité : Élevée — c'est le risque le plus classique d'un projet de session, et l'équipe a plusieurs autres évaluations/cours en parallèle.
- Impact : Moyen — un retard modéré se rattrape en coupant dans les récits should/could; un retard important sur les récits must compromet l'incrément démontrable d'un sprint.
- Signal d'alerte : à la fin du sprint 1, la vélocité réelle (points de récits réellement terminés selon la définition de « terminé ») est inférieure à 70 % de la capacité planifiée dans 04-sprints.md.
- Mesure d'atténuation : l'ordre d'abandon défini dans 04-sprints.md est appliqué sans négociation dès qu'un retard est constaté en mêlée; on ne commence pas un nouveau récit tant que le précédent ne respecte pas entièrement la définition de « terminé », pour éviter d'accumuler du travail à moitié fait sur plusieurs fronts.
# Risque 3 - Mécanisme de concurrence mal implémenté, doubles réservations possibles
- Probabilité : Moyenne — le verrouillage pessimiste et la contrainte d'unicité décrits dans 03-conception.md sont conceptuellement simples, mais une erreur d'implémentation (transaction mal délimitée, contrainte oubliée en migration) passe facilement inaperçue en test manuel.
- Impact : Élevé - compromet directement l'exigence 6 du cours (« point de concurrence réel »), qui est explicitement vérifiée lors de la correction.
- Signal d'alerte : un test automatisé simulant deux confirmations simultanées sur le même siège échoue (les deux réussissent, ou aucune ne réussit proprement), ou le bug est reproduit manuellement en ouvrant deux navigateurs.
- Mesure d'atténuation : écrire le test automatisé de double confirmation simultanée avant le sprint 3 plutôt qu'à la toute fin, et l'intégrer à la chaîne CI dès qu'il existe. Le récit #15 fait l'objet d'une revue de code obligatoire par au moins deux membres de l'équipe, pas seulement l'auteur.

