## Sprint 1 — Alpha (~3 semaines)

- **Objectif** : *un spectateur peut découvrir un événement et réserver un
  siège ; un organisateur peut créer une salle et un événement.*
- **Récits** : #1 (3), #28 (2), #2 (3), #24 (3), #25 (2), #3 (3), #29 (2),
  #4 (3), #5 (3), #30 (2), #6 (3), #26 (3), #27 (2), #7 (3), #42 (2) —
  **39 points**.
- **Responsable de la mêlée** : Delavie.
- **Incrément démontrable** : à partir d'un clone neuf, l'application
  démarre ; on crée un compte organisateur, on se connecte, on crée une
  salle de 40 sièges, on la retrouve dans sa liste, on crée un événement
  qui lui est attribué. Un compte spectateur voit l'événement dans la
  liste, ouvre son plan de salle, réserve deux sièges et les retrouve dans
  « mes réservations ». Une réservation refusée si le siège vient d'être
  pris entretemps est démontrée. La navigation entre toutes ces pages se
  fait via la barre de navigation commune. Chaîne CI verte.

### Bilan (à la remise du 1er octobre)

1. **Points engagés** : 39.
2. **Points livrés** : 39 — un récit à moitié fait vaut zéro point, et les
   15 récits engagés ont du code fusionné dans `main` respectant la
   définition de « terminé » (voir [05-equipe.md](05-equipe.md)).
3. **Vélocité réelle** : 39 points.
4. **Récits abandonnés** : aucun.
5. **Pourquoi** : les 15 récits engagés avaient du code fusionné dans
   `main`, respectant la définition de « terminé », avant la remise du
   1er octobre ; l'ordre d'abandon ci-dessous n'a donc pas eu à être
   appliqué.

## Sprint 2 — Beta (~3 semaines)

- **Objectif** : *un organisateur peut configurer des tarifs et suivre ses
  ventes en direct ; un administrateur supervise la plateforme.*
- **Récits** : #8 (3), #31 (2), #32 (3), #9 (3), #33 (2), #10 (3), #11 (3),
  #34 (2), #12 (3), #13 (3), #35 (2), #14 (3), #19 (3), #36 (2) —
  **37 points**.
- **Ajout en cours de sprint (26 octobre)** : #101 — Se connecter avec
  GitHub (5), exigé pour la version bêta et constaté au point de
  contrôle 2. Il s'ajoute à l'inscription par mot de passe (#1). Engagement
  révisé : **42 points**.
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

### Bilan (à la remise du 29 octobre)

1. **Points engagés** : 42 (37 au départ, plus #101 ajouté le 26 octobre).
2. **Points livrés** : 39. Un récit à moitié fait vaut zéro point. Quatorze récits ont tout leur code
   fusionné dans `main` : #8 (3), #31 (2), #32 (3), #9 (3), #33 (2), #10 (3), #11 (3), #34 (2), #12 (3),
   #13 (3), #35 (2), #14 (3), #36 (2) et #101 (5).
3. **Vélocité réelle** : 39 points (39 au sprint 1).
4. **Récits abandonnés** : la liste globale des organisateurs, #19 du backlog (3), reportée au sprint 3.
5. **Pourquoi** : ce récit n'avait pas d'issue GitHub correspondante (l'issue #19 de GitHub est le
   déploiement), donc ni responsable ni PR. Les autres récits en retard au 26 octobre ont été finis
   avant la remise : #34 fusionné le 28 octobre, #35 le 29 octobre. Le critère de #32 (un siège non
   confirmé redevient libre pour tout le monde) est rempli par le code de #8, fusionné les 25 et
   26 octobre, et l'issue a été fermée le 29 octobre après vérification. Le retard venait surtout de
   sept PR ouvertes le 19 octobre qui ont attendu 6 à 7 jours leur revue (voir la
   [rétrospective du sprint 2](retrospectives/sprint-2.md)).

## Sprint 3 — Version finale (4 semaines, remise le 3 décembre)

- **Objectif** : *le site en ligne est fiable : la réservation résiste à la
  concurrence et aux coupures, la présence est visible, et tout ce que
  l'interface offre fonctionne.*
- **Responsable de la mêlée** : Glodie.
- **Dates** : planification commise le 5 novembre ; points de contrôle les
  12, 19 et 26 novembre et le 3 décembre ; étiquette `finale-v1` sur `main`
  le 3 décembre à 23 h 59 ; site en ligne jusqu'au 23 décembre.

### Récits engagés

Les numéros sont ceux des **issues GitHub**. La dernière colonne donne le
numéro du même récit dans `02-backlog.md` quand il diffère. Un astérisque
indique un responsable proposé, à confirmer à la prochaine mêlée.

| Issue | Récit | Points | MoSCoW | Responsable | Backlog |
|---|---|:---:|---|---|---|
| [#15](../../../issues/15) | Vue globale des organisateurs (reportée du sprint 2) | 3 | Must | Delavie | #19 |
| [#20](../../../issues/20) | Suspendre un compte | 3 | Must | Delavie | |
| [#41](../../../issues/41) | Bloquer la connexion d'un compte suspendu + règle de visibilité | 2 | Must | Delavie* | |
| [#16](../../../issues/16) | Voir mon siège redevenir libre si je ne confirme pas dans le délai | 3 | Must | Glodie | #15 |
| [#17](../../../issues/17) | Empêcher deux confirmations simultanées sur le même siège | 3 | Must | Glodie | #16 |
| [#21](../../../issues/21) | Filtrer les événements par date ou lieu | 3 | Should | Glodie | |
| [#22](../../../issues/22) | Statistiques simples de vente par section | 3 | Should | Glodie | |
| [#18](../../../issues/18) | Resynchroniser mon affichage après une coupure de connexion | 3 | Must | Junior | #17 |
| [#37](../../../issues/37) | Afficher le compte à rebours et gérer l'expiration | 2 | Must | Junior | |
| [#40](../../../issues/40) | Indicateur de connexion perdue/rétablie + blocage des actions | 2 | Must | Junior* | |
| [#145](../../../issues/145) | Présence : voir qui est connecté, retirer une personne qui part | 3 | Must | Yanis* | Nouveau |
| [#38](../../../issues/38) | Test automatisé de confirmation concurrente | 3 | Must | Yanis* | |
| [#39](../../../issues/39) | Resynchroniser l'affichage du client dont la confirmation échoue | 2 | Must | Yanis* | |
| **Total** | 13 récits (Must : 29 points, Should : 6 points) | **35** | | | |

Répartition : Glodie 12, Delavie 8, Yanis 8, Junior 7. La présence est une
exigence de la version finale qu'aucun récit ne couvrait ; ses 3 points sont
une estimation à confirmer en équipe.

**Non engagés** :

- Le déploiement ([#19](../../../issues/19), #18 du backlog) a été livré le
  29 octobre. Son suivi fait partie de la réserve ci-dessous.
- La connexion Google et Microsoft (#114 du backlog) a été fusionnée au
  sprint 2, hors engagement.
- Dupliquer un événement ([#23](../../../issues/23), `Could`) et changer le
  rôle d'un utilisateur ([#106](../../../issues/106), fermée, à rouvrir au besoin) ne seront pris que s'il
  reste de la capacité.

### Capacité

| Élément | Calcul |
|---|---|
| Vélocité des sprints 1 et 2 | 39 et 39 points |
| Moyenne | (39 + 39) / 2 = 39 points pour environ 3 semaines |
| Ramenée à quatre semaines | 39 / 3 × 4 = **52 points** |
| Récits engagés | 35 points (67 %) |
| Réserve | 52 − 35 = **17 points** (33 %) |

La réserve sert au travail que le sprint exige sans qu'il corresponde à un
récit : stabilité du site en ligne, tests sur le site et depuis un clone neuf,
connexion GitHub avec les deux URL de retour (en ligne et `localhost`),
correction des bogues, et retrait de ce qui n'est pas prêt (aucun bouton inactif
à la remise).

### Ordre d'abandon

Ce qui marche passe avant ce qui s'ajoute. En cas de retard, on abandonne dans
cet ordre, et l'interface correspondante est retirée :

1. [#22](../../../issues/22) — Statistiques par section (`Should`).
2. [#21](../../../issues/21) — Filtres de la liste des événements (`Should`).
3. [#20](../../../issues/20) et [#41](../../../issues/41), ensemble — Suspension
   d'un compte : `Must` du backlog, mais pas une exigence de la version finale.

La concurrence (#17, #38, #39), l'expiration (#16, #37), la resynchronisation
(#18, #40) et la présence ne sont pas négociables : la version finale les exige.

### Incrément démontrable

Sur le site en ligne, à la version `finale-v1` : un siège en sélection non
confirmé se libère après le délai, avec compte à rebours visible ; deux
confirmations envoyées au même instant sur le même siège n'en laissent passer
qu'une, ce qu'un test de concurrence vérifie dans la CI, et la personne refusée
en est informée. Une coupure réseau est suivie d'une resynchronisation correcte
du plan, avec indicateur visuel. La présence montre qui est connecté et retire
une personne qui part. Un administrateur voit tous les organisateurs et suspend
un compte, qui ne peut plus se connecter.

## Capacité du sprint 1

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
