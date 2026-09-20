## Sprint 1 — Alpha (~3 semaines)

- **Objectif** : *un spectateur peut découvrir un événement et réserver un
  siège ; un organisateur peut créer une salle et un événement.*
- **Récits** : #1 (3), #28 (2), #2 (3), #24 (3), #25 (2), #3 (3), #29 (2),
  #4 (3), #5 (3), #30 (2), #6 (3), #26 (3), #27 (2), #7 (3), #42 (2) —
  **39 points**.
- **Incrément démontrable** : à partir d'un clone neuf, l'application
  démarre ; on crée un compte organisateur, on se connecte, on crée une
  salle de 40 sièges, on la retrouve dans sa liste, on crée un événement
  qui lui est attribué. Un compte spectateur voit l'événement dans la
  liste, ouvre son plan de salle, réserve deux sièges et les retrouve dans
  « mes réservations ». Une réservation refusée si le siège vient d'être
  pris entretemps est démontrée. La navigation entre toutes ces pages se
  fait via la barre de navigation commune. Chaîne CI verte.

## Sprint 2 — Beta (~3 semaines)

- **Objectif** : *un organisateur peut configurer des tarifs et suivre ses
  ventes en direct ; un administrateur supervise la plateforme.*
- **Récits** : #8 (3), #31 (2), #32 (3), #9 (3), #33 (2), #10 (3), #11 (3),
  #34 (2), #12 (3), #13 (3), #35 (2), #14 (3), #19 (3), #36 (2) —
  **37 points**.
- **Incrément démontrable** : deux spectateurs ouvrent le même plan de
  salle dans deux fenêtres ; le siège que l'un sélectionne passe « en
  sélection » chez l'autre en temps réel, et redevient libre s'il n'est
  pas confirmé. Un test automatisé confirme qu'une requête directe
  contournant l'interface échoue selon le rôle. Une salle a des sections
  à deux tarifs, affichées par couleur. L'organisateur voit ses ventes se
  mettre à jour en direct et peut annuler une réservation ; le spectateur
  peut annuler la sienne. Un compte administrateur voit tous les
  organisateurs et tous les événements de la plateforme, avec détail au
  clic.

## Sprint 3 — Version finale (~5 semaines)

- **Objectif** : *la réservation résiste à la concurrence et aux pannes,
  et l'application est accessible publiquement.*
- **Récits** : #15 (3), #37 (2), #16 (3), #38 (3), #39 (2), #17 (3), #40 (2),
  #18 (3), #20 (3), #41 (2), #21 (3), #22 (3) — **32 points**.
- **Incrément démontrable** : un siège en sélection non confirmé se libère
  automatiquement après le délai, avec compte à rebours visible ; deux
  confirmations envoyées au même instant sur le même siège n'en laissent
  passer qu'une, démontré par un test de concurrence intégré à la CI.
  Une coupure réseau simulée est suivie d'une resynchronisation correcte
  du plan, avec indicateur visuel. Un administrateur suspend un compte et
  le compte suspendu ne peut plus se connecter. L'application est
  accessible via une URL publique, déployée automatiquement.

## Capacité

| Élément | Calcul |
|---|---|
| Blocs de cours dans le sprint 1 | 6 blocs × 3 h = 18 h |
| Travail personnel | 3 h/semaine × 3 semaines = 9 h |
| Total par personne | 27 h |
| Équipe de 4 | 108 heures-personne |
| Moins rituels, coordination, revues (~20 %) | ≈ **86 h de développement** |

Nous ne connaissons pas encore notre vélocité. En proportion des 65 h /
~20 points du gabarit (équipe de 3), nos 86 h suggèrent une capacité brute
d'environ **26 points** ; après correction du biais d'optimisme (−30 %),
une estimation prudente viserait plutôt **18 points** pour un premier
sprint.

Nous avons choisi de nous engager tout de même sur **39 points** au
sprint 1, en connaissance du risque, pour deux raisons : plusieurs récits
(créer un compte, créer une salle, créer un événement) touchent des
opérations CRUD que l'équipe a déjà pratiquées dans d'autres cours et
estime donc moins risquées que ne le suggère leur nombre de points ; et
nous préférons prendre ce risque tôt, quand il reste deux sprints pour
corriger le tir, plutôt que de découvrir un écart de vélocité au sprint 3.
L'ordre d'abandon ci-dessous est notre filet de sécurité si l'écart se
confirme dès les premières mêlées.

## Ordre d'abandon

Tous les récits du sprint 1 sont `Must`, avec des dépendances fortes entre
eux (créer une salle avant un événement, créer un événement avant de le
lister, etc.) — il n'y a donc pas de récit du sprint 1 qui puisse sauter
sans casser l'objectif. Si nous prenons du retard, l'abandon se fait plutôt
en **repoussant des récits entiers au sprint suivant**, dans cet ordre :

1. [#7](../../../issues/7) — Voir mes réservations : utile, mais l'objectif du sprint tient déjà
   sans lui si la réservation elle-même (#6) fonctionne.
2. [#6](../../../issues/6), [#26](../../../issues/26), [#27](../../../issues/27) — Réserver un ou plusieurs sièges libres et
   sa gestion de concurrence, *en dernier recours seulement* : sans eux, le
   sprint ne démontre plus rien d'utile au spectateur, mais il reste
   préférable de livrer un incrément partiel plutôt qu'un sprint vide.

Si #6 ou #7 saute, [#42](../../../issues/42) (navbar) doit aussi être ajusté : ses liens
dépendent des pages effectivement livrées ce sprint-là.

La création de compte (#1), de salle (#2) et d'événement (#3) ne sont pas
négociables : sans eux, aucun autre récit du produit n'a de sens.

Pour les sprints 2 et 3, l'ordre d'abandon suit MoSCoW en priorité : les
`Should` (#21, #22) et le `Could` (#23) sautent avant tout récit `Must`.
