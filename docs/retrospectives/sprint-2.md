# Rétrospective — Sprint 2

Lundi 26 octobre 2026. Présents : Oughlis Yanis, Illunga Katanga Glodie, Dossouh Delavie, Agbloyoe Oladé Junior.

Les constats ci-dessous s'appuient sur l'historique des deux dépôts : PR fusionnées depuis le 1er octobre, état des issues et du journal au 26 octobre.

## Ce qui a bien fonctionné et qu'on garde

- **Les récits les plus techniques du sprint sont livrés.**
  - #8 et #31, sélection en temps réel avec Socket.IO, par Yanis (backend PR #23 et #28, frontend PR #92 et #96).
  - #9 et #33, rôles vérifiés côté serveur, contournement testé, par Oladé (backend PR #27).
  - #10, modification d'une salle, par Yanis (backend PR #26, frontend PR #94).
  - #11, sections tarifaires, par Delavie (backend PR #33, frontend PR #100).
  - #12, annulation par le spectateur, par Glodie (backend PR #30, frontend PR #97).
  - #13 et #14, ventes en direct et annulation par l'organisateur, par Delavie (backend PR #24 et #25, frontend PR #93 et #95).
  - #36, supervision des événements par l'administrateur, par Oladé (backend PR #31, frontend PR #98).

  Cela fait **27 points sur 37**.
- **Les tests ont suivi.** Le backend compte 291 tests unitaires. Les migrations de schéma (#14, #11) sont aussi vérifiées par des tests d'intégration sur un vrai PostgreSQL, notamment pour la concurrence : deux réservations simultanées n'en laissent passer qu'une.
- **Les fusions sont faites par un autre membre que l'auteur** : 17 PR sur 18, en général après un commentaire de validation (« Testé et approuvé »).

## Ce qui nous a ralentis

- **Les PR attendaient une semaine.** Sept PR ouvertes le 19 octobre (frontend #96, #97 et #98, backend #27, #28, #30 et #31) n'ont été fusionnées que les 25 et 26 octobre. Elles touchaient les mêmes fichiers de réservation. Leur fusion, toutes en même temps, a provoqué des conflits qu'il a fallu résoudre dans #11 (frontend PR #100, backend PR #33). Deux PR déjà fusionnées ont aussi été rouvertes par erreur (frontend #99, backend #32).
- **À l'inverse, d'autres PR ont été fusionnées en moins de 15 minutes après leur ouverture** (frontend #94 et #95, backend #25 et #26), ce qui laisse peu de place à un vrai test.
- **Les issues ne se ferment pas toutes seules.** #12, #13 et #14 sont livrés, mais leurs issues étaient encore ouvertes le 26 octobre, faute de `Closes #n` dans la description des PR. Le tableau Kanban ne reflète donc plus l'avancement réel.
- **Les numéros du backlog ne correspondent pas tous aux issues GitHub.** Dans `02-backlog.md`, #18 est le déploiement et #19 la liste des organisateurs. Sur GitHub, l'issue #18 est la resynchronisation et l'issue #19 le déploiement. Une PR liée au mauvais numéro ferme la mauvaise issue.
- **Le journal n'a reçu aucune entrée depuis le 1er octobre.**

## Récits non terminés

| Récit | Points | Responsable | État au 26 octobre |
|---|---|---|---|
| #32 Libérer automatiquement un siège en sélection non confirmé | 3 | Glodie | Pas de PR fusionnée |
| #34 Afficher les sections par couleur sur le plan de salle | 2 | Yanis | Pas de PR fusionnée. La couleur des sections est déjà enregistrée par #11 |
| #35 Mettre à jour les statistiques de vente en direct | 2 | Glodie | Pas de PR fusionnée. Le tableau de bord de #13 se rafraîchit déjà toutes les 5 s, il faut vérifier ce qu'il reste à faire |
| Liste globale des organisateurs (admin), #19 du backlog | 3 | — | Pas de PR fusionnée |

Ces récits totalisent 10 points et passent au sprint 3. #36 est compté : son backend (backend PR #31) a été fusionné le 26 octobre, après sept jours d'attente. Vélocité du sprint 2 : **27 points** (39 au sprint 1).

## Les changements décidés au sprint 1 : appliqués ?

| Changement | Responsable | Appliqué ? | Effet constaté |
|---|---|---|---|
| Yanis devient responsable de la mêlée. | Oughlis Yanis | Oui | Yanis a tenu le rôle. Les fusions ont surtout été faites par Oladé, qui en a fusionné 13 sur 18. |
| Plus d'auto-approbation : chaque PR est approuvée par un coéquipier qui n'a pas écrit le code. | Dossouh Delavie | En partie | 17 PR sur 18 ont été fusionnées par un autre membre, en général après un commentaire « Testé et approuvé ». Exception : frontend PR #100, fusionnée par son auteur. L'approbation passe par un commentaire, pas par une revue GitHub (bouton *Approve*), et rien n'empêche techniquement de fusionner sans elle. |
| Toute PR reçoit une revue dans les 24 h après son ouverture. | Illunga Katanga Glodie | Non | Sept PR ont attendu 6 à 7 jours. Cette accumulation est la cause directe des conflits de fin de sprint. |
| Le journal est mieux rempli : une entrée par bloc, le jour même. | Agbloyoe Oladé Junior | Non | Aucune entrée depuis le 1er octobre. |

## Ce qu'on change au sprint 3

| Changement | Responsable | Vérification à la rétrospective du sprint 3 |
|---|---|---|
| Une règle de protection de la branche `main` est activée sur les deux dépôts : on ne fusionne que par PR, avec au moins **une approbation GitHub** (bouton *Approve*) d'un membre qui n'en est pas l'auteur. Au début de chaque bloc, le responsable de la mêlée passe en revue les PR ouvertes depuis plus de 24 h et attribue chacune à un relecteur. | Oughlis Yanis | Dans *Settings > Branches*, la règle est active sur Seats-Frontend et Seats-Backend. Chaque PR fusionnée pendant le sprint 3 a une approbation d'un autre membre, et aucune n'est restée plus de 48 h sans revue. |

On revérifie ce changement à la rétrospective du sprint 3.
