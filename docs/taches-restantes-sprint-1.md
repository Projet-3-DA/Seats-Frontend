# Tâches restantes — Sprint 1

Échéance : **jeudi 1er octobre 2026, 23h59** — tag `alpha-v1` sur `main`, poussé (`git tag -a alpha-v1 -m "Alpha" && git push origin alpha-v1`). Point de contrôle le 28 septembre : l'app doit démarrer depuis un clone neuf, CI verte, au moins un récit terminé.

Grille complète : https://archambaultv.github.io/2026A-420-5D1-MA-Gr2/docs/evaluations/sprint_1/

---

## 🔴 Critères de la grille pas encore remplis (bloquants pour "Acquis", indépendants des récits)

1. **Docker-compose unifié** : aujourd'hui, `Seats-Backend/docker-compose.yml` ne démarre que Postgres (ajouté pour les tests d'intégration de #27). Il manque une seule commande (`docker compose up`) qui démarre **backend + frontend + Postgres** ensemble, depuis un clone neuf, sans installation supplémentaire.
2. **Comptes de démo** : aucun script ne crée automatiquement un compte par rôle (spectateur, organisateur, administrateur) au démarrage. La grille exige de pouvoir naviguer dans chaque rôle sans configuration manuelle.
3. **README** :
   - `Seats-Frontend/README.md` : aucune commande de démarrage, aucune URL à ouvrir, aucune commande de test, aucun compte de démo, aucune liste des éléments simulés.
   - `Seats-Backend/README.md` : ne contient que le titre.
   - Les deux sont explicitement exigés par la grille de vérification.
4. **Déclarer les éléments simulés** : ex. l'image aléatoire (picsum) utilisée par défaut quand aucune affiche n'est fournie doit être annoncée à l'écran (ex. petit badge "image de démonstration") **et** listée dans le README.
5. **`docs/retrospectives/sprint-1.md`** : n'existe pas encore. À rédiger à la rétrospective du 1er octobre — doit conclure sur une amélioration concrète et assignée à quelqu'un.
6. **`docs/journal.md`** : la dernière entrée date du 21 septembre. À vérifier collectivement : est-ce qu'il manque des entrées pour les blocs de cours plus récents ? La grille exige une entrée par bloc, commitée le jour même.

## 🟡 Récits engagés au sprint 1, pas encore terminés

- **#7 — Voir mes réservations** : l'écran (`(tabs)/reservations.jsx`) est encore un stub statique (liste vide en dur), pas branché sur `GET /api/reservations`.
- **#25 — Voir la liste de mes salles** : aucun écran de liste pour un organisateur ; seule la création (`organisateur/salles/nouvelle.jsx`) existe. Le nouveau hub "Organiser" ne fait que créer, il ne liste pas les salles existantes.
- **#30 — Empêcher la sélection d'un siège déjà réservé/en sélection par un autre** : pas implémenté. C'est distinct de #6/#26/#27 (qui garantissent qu'une réservation concurrente échoue proprement côté serveur) — #30 concerne le blocage visuel/temps réel côté client, pour éviter qu'un spectateur perde son temps à sélectionner un siège voué à l'échec.
- **#24 — Générer et afficher le plan de sièges individuel** : à vérifier avec l'équipe si ce n'est pas déjà couvert par #5 (fermé) — l'écran `events/[id].jsx` affiche déjà un plan de sièges individuel avec état libre/réservé. Si c'est le cas, fermer #24 comme doublon ; sinon préciser ce qui manque.

## 🟢 Fonctionnellement fait, mais à nettoyer administrativement

- **#6, #26, #28** sont fermées en apparence (code mergé sur `main`, testé) mais encore **"open" sur GitHub** — à fermer en référençant la/les PR qui les résolvent. La grille exige que "l'état de chaque ticket soit à jour".
- **PR #56 (barre d'onglets)** et **PR #57 (affiche dans la liste d'événements)** sont ouvertes sur Seats-Frontend, en attente de revue. La grille exige une revue par **quelqu'un d'autre que l'auteur**, avec une trace visible — donc pas d'auto-approbation.
- **#42** : le doc `04-sprints.md` le décrit comme la navbar, mais le titre réel de l'issue GitHub est *"Feature/2 page creation de salles"*, ce qui ne correspond pas. À clarifier en équipe — soit l'issue a été mal nommée à la création, soit ce n'est pas le bon numéro pour la navbar.

## Rappel : critères de conduite de sprint à surveiller d'ici le 1er octobre

- Chaque membre doit être responsable d'au moins un récit (table de contribution dans `05-equipe.md` à tenir à jour).
- Les changements d'état des tickets et les commits doivent être étalés sur les trois semaines, pas groupés juste avant la deadline — le correcteur regarde l'historique Git.
- Toute dérogation à l'engagement initial (récit abandonné, redécoupé) doit suivre l'ordre d'abandon documenté dans `04-sprints.md`, ou être justifiée si l'ordre n'est pas respecté.
