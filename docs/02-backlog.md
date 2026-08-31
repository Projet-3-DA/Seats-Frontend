# Backlog produit — photo au moment de la remise
## Les épiques

- **Comptes** — inscription, connexion, rôles et permissions.
- **Salles** — créer et gérer un plan de salle réutilisable (rangées, sièges, sections tarifaires).
- **Événements** — créer un événement et lui attribuer une salle existante.
- **Réservations** — sélection de sièges, confirmation, concurrence, temps réel.
- **Suivi organisateur** — tableau de bord, ventes en direct, annulation côté organisateur.
- **Mes réservations** — historique et annulation côté spectateur.
- **Infrastructure** — déploiement, CI/CD.
- **Administration** — vue globale multi-organismes, suspension de comptes.

## Les récits `must`, dans l'ordre

L'ordre suit les deux critères des notes de cours : la **dépendance** (« réserver un siège » n'a aucun sens avant « voir le plan de salle », qui n'a aucun sens avant « créer une salle ») et le **risque** (la concurrence et le temps réel — les parties les plus incertaines — passent au sprint 2-3, pas à la fin).

| # | Récit | Épique | Points | Sprint |
|---|---|---|---|---|
| [#1](../../../issues/1) | Créer un compte et me connecter | Comptes | 5 | 1 |
| [#2](../../../issues/2) | Créer une salle avec sa disposition de sièges | Salles | 8 | 1 |
| [#3](../../../issues/3) | Créer un événement et lui attribuer une salle existante | Événements | 5 | 1 |
| [#4](../../../issues/4) | Voir la liste des événements à venir | Événements | 3 | 1 |
| [#5](../../../issues/5) | Voir le plan de salle d'un événement et l'état des sièges | Événements | 5 | 1 |
| [#6](../../../issues/6) | Réserver un ou plusieurs sièges libres | Réservations | 8 | 1 |
| [#7](../../../issues/7) | Voir mes réservations | Mes réservations | 3 | 1 |
| [#8](../../../issues/8) | Voir un siège passer « en sélection » en temps réel | Réservations | 8 | 2 |
| [#9](../../../issues/9) | Restreindre les actions selon mon rôle, vérifié côté serveur | Comptes | 5 | 2 |
| [#10](../../../issues/10) | Modifier une salle existante tant qu'aucun événement ne l'utilise | Salles | 3 | 2 |
| [#11](../../../issues/11) | Configurer des sections à tarifs différents dans une salle | Salles | 5 | 2 |
| [#12](../../../issues/12) | Annuler une réservation à venir | Mes réservations | 3 | 2 |
| [#13](../../../issues/13) | Voir en direct l'état de vente d'un événement | Suivi organisateur | 5 | 2 |
| [#14](../../../issues/14) | Annuler une réservation en tant qu'organisateur | Suivi organisateur | 3 | 2 |
| [#15](../../../issues/15) | Voir mon siège redevenir libre si je ne confirme pas dans le délai | Réservations | 5 | 3 |
| [#16](../../../issues/16) | Empêcher deux confirmations simultanées sur le même siège | Réservations | 8 | 3 |
| [#17](../../../issues/17) | Resynchroniser mon affichage après une coupure de connexion | Réservations | 5 | 3 |
| [#18](../../../issues/18) | Accéder à l'application déployée sur un serveur public | Infrastructure | 3 | 3 |
| [#19](../../../issues/19) | Voir une vue globale des organisateurs et des événements de la plateforme | Administration | 5 | 2 |
| [#20](../../../issues/20) | Suspendre un compte (organisateur ou spectateur) en cas d'abus | Administration | 5 | 3 |

## Les récits `should` et `could`

| # | Récit | Épique | MoSCoW | Points | Sprint |
|---|---|---|---|---|---|
| [#21](../../../issues/21) | Filtrer les événements par date ou lieu | Événements | Should | 3 | 3 |
| [#22](../../../issues/22) | Voir des statistiques simples de vente par section | Suivi organisateur | Should | 3 | 3 |
| [#23](../../../issues/23) | Dupliquer un événement existant pour créer rapidement une nouvelle séance | Événements | Could | 2 | — |

## Won't (hors portée cette session)

Paiement réel, notifications email/SMS, éditeur graphique glisser-déposer du plan de salle, revente/transfert de place, événement réparti sur plusieurs salles simultanément, liste d'attente, comptes administrateurs hiérarchisés, **consultation des événements sans créer de compte (invité)**.

## Démarche d'estimation

Nous estimons en points de récit sur l'échelle 1, 2, 3, 5, 8. Notre récit de
référence est *Voir la liste des événements à venir* ([#4](../../../issues/4)),
décrété à **3 points** : lecture simple, une seule entité, pas d'écriture.

>À compléter en équipe** : décrivez ici un désaccord réel survenu en
> planning poker (ex. un récit où les cartes divergeaient de plus d'un cran,
> ce qui a été découvert en en discutant, et comment le récit a été découpé
> ou réestimé en conséquence) — comme l'exemple du cours avec *Importer un
> CSV bien formé*. Ce paragraphe doit raconter un désaccord vécu, pas
> hypothétique.

## Récits du sprint 1 (avec critères d'acceptation)

### [#1](../../../issues/1) — Créer un compte et me connecter
**En tant que** visiteur, **je veux** créer un compte et me connecter **afin de** pouvoir accéder aux fonctionnalités réservées aux membres, selon mon rôle.

**Critères d'acceptation**
- Je peux m'inscrire avec un courriel, un mot de passe et un rôle (organisateur ou spectateur).
- Un courriel déjà utilisé refuse une nouvelle inscription, avec un message clair.
- Une fois connecté, ma session persiste d'une page à l'autre.
- Un mot de passe incorrect refuse la connexion sans révéler si le courriel existe.

### [#2](../../../issues/2) — Créer une salle avec sa disposition de sièges
**En tant qu'**organisateur, **je veux** créer une salle en indiquant un nombre de rangées et de sièges par rangée **afin de** pouvoir la réutiliser pour tous les événements qui s'y tiennent, sans la reconfigurer à chaque fois.

**Critères d'acceptation**
- Je peux nommer une salle et définir sa disposition (nombre de rangées, sièges par rangée).
- Le plan généré affiche chaque siège individuellement, identifié par rangée et numéro (ex. A-12).
- La salle créée apparaît dans ma liste de salles, disponible pour être attribuée à un futur événement.
- Une salle sans aucun siège ne peut pas être enregistrée (message d'erreur explicite).

### [#3](../../../issues/3) — Créer un événement et lui attribuer une salle existante
**En tant qu'**organisateur, **je veux** créer un événement (titre, description, date, lieu) et lui attribuer une salle que j'ai déjà créée **afin de** vendre des places sans redéfinir un plan à chaque fois.

**Critères d'acceptation**
- Un formulaire permet de saisir titre, description, date et lieu ; tous les champs sauf la description sont obligatoires.
- Un menu déroulant liste les salles que j'ai déjà créées ; j'en choisis une pour l'événement.
- Une date passée est refusée avec un message explicite.
- Un événement ne peut pas être publié sans salle attribuée.
- Un spectateur ne peut pas accéder à ce formulaire.

 [#4](../../../issues/4) — Voir la liste des événements à venir
**En tant que** spectateur, **je veux** voir la liste des événements à venir **afin de** choisir celui auquel je veux assister.

**Critères d'acceptation**
- La liste affiche au minimum le titre, la date et le lieu de chaque événement.
- Seuls les événements dont la date n'est pas passée sont affichés.
- Cliquer sur un événement m'amène à son plan de salle.
- La liste est vide (avec un message clair) si aucun événement n'est à venir.

 [#5](../../../issues/5) — Voir le plan de salle d'un événement et l'état des sièges
**En tant que** spectateur, **je veux** voir le plan de la salle d'un événement avec l'état de chaque siège **afin de** savoir lesquels sont disponibles.

**Critères d'acceptation**
- Chaque siège affiche visuellement son état : libre ou réservé (l'état « en sélection » arrive au sprint 2).
- Le plan reflète l'état réel de la base de données au chargement de la page.
- Un siège réservé n'est pas cliquable pour une nouvelle réservation.

 [#6](../../../issues/6) — Réserver un ou plusieurs sièges libres
**En tant que** spectateur, **je veux** réserver un ou plusieurs sièges libres **afin de** m'assurer une place à l'événement.

**Critères d'acceptation**
- Je peux sélectionner un ou plusieurs sièges libres puis confirmer en une action.
- Une fois confirmés, les sièges passent à l'état « réservé », associés à mon compte, et une confirmation visuelle claire m'est montrée.
- Si un siège sélectionné a été réservé par quelqu'un d'autre entre l'affichage et ma confirmation, ma tentative est refusée avec un message explicite.
- Une contrainte d'unicité en base empêche qu'un même siège soit associé à deux réservations, même en cas de requêtes simultanées.

 [#7](../../../issues/7) — Voir mes réservations
**En tant que** spectateur, **je veux** voir la liste de mes réservations **afin de** retrouver mes places pour mes événements à venir.

**Critères d'acceptation**
- La liste affiche, pour chaque réservation, l'événement, la date et les sièges réservés.
- Seules mes propres réservations apparaissent.
- Une réservation pour un événement passé est indiquée comme telle (ex. libellé « terminé »).

  Récits du sprint 2 (avec critères d'acceptation)
[#8](../../../issues/8) — Voir un siège passer « en sélection » en temps réel

En tant que spectateur, je veux voir un siège passer à l'état « en sélection » en temps réel dès qu'un autre spectateur le choisit afin de ne pas perdre de temps à sélectionner un siège déjà pris par quelqu'un d'autre.

Critères d'acceptation

Dès qu'un spectateur clique sur un siège libre, tous les autres spectateurs consultant le même plan voient ce siège passer à « en sélection » en quelques secondes, sans recharger la page.
Un siège « en sélection » n'est pas cliquable par les autres spectateurs.
Si le spectateur qui a sélectionné le siège ne confirme pas (annule ou quitte), le siège redevient visible comme libre pour tout le monde.
La mise à jour utilise un mécanisme temps réel (ex. WebSocket), pas un rafraîchissement périodique par sondage agressif.

[#9](../../../issues/9) — Restreindre les actions selon mon rôle, vérifié côté serveur

**En tant qu'**utilisateur du système (tout rôle), je veux que chaque action soit vérifiée selon mon rôle directement côté serveur afin de garantir qu'aucun utilisateur ne puisse contourner les restrictions en modifiant les requêtes envoyées au client.

Critères d'acceptation

Une requête tentant une action réservée à l'organisateur (ex. créer un événement) est refusée par le serveur si l'utilisateur authentifié n'a pas ce rôle, même envoyée directement sans passer par l'interface.
Une requête réservée à l'administrateur est refusée pour un compte organisateur ou spectateur.
Le refus renvoie un code d'erreur clair (403) sans révéler de détails sensibles sur le système.
Les vérifications de rôle sont centralisées (middleware ou équivalent), pas dupliquées à la main dans chaque route.

[#10](../../../issues/10) — Modifier une salle existante tant qu'aucun événement ne l'utilise

**En tant qu'**organisateur, je veux modifier la disposition d'une salle que j'ai créée, tant qu'aucun événement ne l'utilise encore, afin de corriger une erreur de configuration avant sa première utilisation.

Critères d'acceptation

Je peux modifier le nom et la disposition (rangées, sièges) d'une salle qui n'est associée à aucun événement.
Une salle déjà associée à au moins un événement ne peut pas être modifiée ; un message explicite en indique la raison.
Les modifications sont immédiatement reflétées dans le plan de la salle.
Une salle vidée de tous ses sièges via l'édition ne peut pas être enregistrée (même règle qu'à la création).

[#11](../../../issues/11) — Configurer des sections à tarifs différents dans une salle

**En tant qu'**organisateur, je veux diviser une salle en sections à tarifs différents (ex. parterre, balcon) afin de pouvoir vendre des places à des prix distincts selon leur emplacement.

Critères d'acceptation

Je peux assigner un groupe de sièges à une section nommée, avec un prix associé.
Chaque siège appartient à une seule section à la fois.
Le plan de salle affiche visuellement les sections (ex. par couleur) pour l'organisateur et pour le spectateur.
Une salle sans section définie utilise un tarif unique par défaut.

[#12](../../../issues/12) — Annuler une réservation à venir

En tant que spectateur, je veux annuler une réservation à venir afin de libérer mes sièges si je ne peux plus assister à l'événement.

Critères d'acceptation

Je peux annuler une réservation seulement si l'événement n'a pas encore eu lieu.
Une fois annulée, les sièges concernés redeviennent immédiatement disponibles pour les autres spectateurs.
La réservation annulée est retirée de ma liste active de réservations (ou marquée comme annulée, selon le choix d'affichage retenu).
Une tentative d'annuler une réservation qui ne m'appartient pas est refusée.

[#13](../../../issues/13) — Voir en direct l'état de vente d'un événement

**En tant qu'**organisateur, je veux voir en direct l'état des ventes de mon événement afin de suivre combien de places sont vendues et lesquelles restent disponibles.

Critères d'acceptation

Le tableau de bord affiche le nombre de sièges vendus, en sélection, et libres, pour l'événement choisi.
Les chiffres se mettent à jour sans que je doive recharger la page.
Je ne peux voir que les statistiques de mes propres événements.
Le total affiché correspond en tout temps à l'état réel du plan de salle.

[#14](../../../issues/14) — Annuler une réservation en tant qu'organisateur

**En tant qu'**organisateur, je veux pouvoir annuler la réservation d'un spectateur afin de résoudre un problème (erreur, abus, demande du spectateur) sans devoir intervenir directement en base de données.

Critères d'acceptation

Je peux annuler n'importe quelle réservation liée à un de mes événements, avec un motif optionnel.
Le siège annulé redevient disponible immédiatement.
Le spectateur concerné voit sa réservation annulée dans son propre historique.
Je ne peux pas annuler une réservation liée à l'événement d'un autre organisateur.

[#19](../../../issues/19) — Voir une vue globale des organisateurs et des événements de la plateforme

**En tant qu'**administrateur, je veux voir la liste de tous les organisateurs inscrits et de tous les événements créés sur la plateforme, peu importe qui les a créés, afin de superviser l'ensemble de l'activité de la plateforme.

Critères d'acceptation

La liste des organisateurs affiche au minimum leur nom et courriel, et le nombre d'événements créés par chacun.
La liste des événements affiche tous les événements, avec l'organisateur associé à chacun, sans filtre par mes propres créations.
Un organisateur ou un spectateur ne peut pas accéder à cette vue.
Cliquer sur un événement ou un organisateur permet d'en voir le détail.

Récits du sprint 3 (avec critères d'acceptation)

[#15](../../../issues/15) — Voir mon siège redevenir libre si je ne confirme pas dans le délai

En tant que spectateur, je veux que mon siège sélectionné redevienne libre si je ne confirme pas ma réservation dans un délai raisonnable afin de ne pas bloquer un siège indéfiniment pour les autres si je change d'avis ou quitte la page.

Critères d'acceptation

Un siège passé en « sélection » redevient automatiquement « libre » si aucune confirmation n'arrive dans le délai fixé (ex. 5 minutes).
Le spectateur voit un indicateur du temps restant avant l'expiration.
Si le délai expire pendant la tentative de confirmation, celle-ci est refusée avec un message clair, et le spectateur doit resélectionner le siège.
L'expiration du délai est vérifiée côté serveur, pas seulement dans l'interface du client.

[#16](../../../issues/16) — Empêcher deux confirmations simultanées sur le même siège

En tant que spectateur, je veux avoir la certitude qu'un siège que je confirme ne peut pas être attribué à quelqu'un d'autre au même instant afin de éviter les doubles réservations que la plateforme est censée éliminer.

Critères d'acceptation

Si deux spectateurs tentent de confirmer le même siège au même moment, une seule confirmation réussit ; l'autre est refusée avec un message explicite.
La garantie repose sur une contrainte au niveau de la base de données (ex. contrainte d'unicité ou verrou), pas seulement sur une vérification applicative contournable par une course de requêtes.
Un test simulant des requêtes concurrentes confirme qu'aucun siège ne peut se retrouver associé à deux réservations actives.
Le spectateur dont la confirmation échoue voit l'état à jour du siège sans devoir recharger manuellement.

[#17](../../../issues/17) — Resynchroniser mon affichage après une coupure de connexion

En tant que spectateur, je veux que mon affichage se resynchronise automatiquement si ma connexion internet est interrompue puis rétablie afin de ne pas prendre de décision (réserver, confirmer) sur un plan de salle obsolète.

Critères d'acceptation

Après une coupure suivie d'une reconnexion, l'application détecte la reconnexion et redemande l'état actuel du plan de salle.
L'affichage des sièges reflète l'état réel après resynchronisation, y compris les changements survenus pendant la coupure.
Un indicateur visuel informe le spectateur que la connexion a été perdue puis rétablie.
Aucune action de réservation n'est possible tant que la resynchronisation n'est pas confirmée.

[#18](../../../issues/18) — Accéder à l'application déployée sur un serveur public

**En tant qu'utilisateur (tout rôle confondu), je veux accéder à l'application via une adresse publique afin de pouvoir l'utiliser sans dépendre de l'environnement de développement d'un membre de l'équipe.

Critères d'acceptation

L'application est accessible via une URL publique fonctionnelle, sans configuration locale requise.
Le frontend et le backend communiquent correctement dans cet environnement déployé (pas seulement en local).
Une mise à jour poussée sur la branche principale est déployée automatiquement, ou via une procédure documentée et reproductible.
Les données créées sur l'environnement déployé persistent d'une session à l'autre.

[#20](../../../issues/20) — Suspendre un compte (organisateur ou spectateur) en cas d'abus

**En tant qu'**administrateur, je veux suspendre le compte d'un organisateur ou d'un spectateur afin de réagir à un abus signalé sans devoir supprimer le compte définitivement.

Critères d'acceptation

Je peux changer le statut d'un compte de « actif » à « suspendu », avec une raison optionnelle enregistrée.
Un compte suspendu ne peut plus se connecter ; un message clair l'en informe à la tentative de connexion.
Les événements et salles d'un organisateur suspendu suivent la règle décidée en équipe (visibles ou masqués aux spectateurs — à préciser dans 03-conception.md).
Seul un administrateur peut suspendre ou réactiver un compte.

[#21](../../../issues/21) — Filtrer les événements par date ou lieu

En tant que spectateur, je veux filtrer la liste des événements par date ou par lieu afin de trouver plus rapidement un événement qui m'intéresse quand la liste devient longue.

Critères d'acceptation

Je peux filtrer les événements affichés par une plage de dates.
Je peux filtrer les événements par lieu (ou par salle).
Les filtres peuvent être combinés.
L'absence de résultat correspondant affiche un message clair plutôt qu'une liste vide sans explication.

[#22](../../../issues/22) — Voir des statistiques simples de vente par section

**En tant qu'**organisateur, je veux voir des statistiques simples de vente ventilées par section tarifaire afin de comprendre quelles sections se vendent le mieux pour ajuster mes futurs événements.

Critères d'acceptation

Pour un événement donné, je vois le nombre de sièges vendus et le revenu généré par section.
Les statistiques se basent sur les réservations confirmées uniquement, pas les sièges « en sélection ».
Je ne vois les statistiques que pour mes propres événements.
Une section sans aucune vente affiche clairement zéro plutôt que d'être omise.

