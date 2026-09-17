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

## Note sur le découpage des récits à 5 et 8 points

Les récits initialement estimés à 5 ou 8 points ont été subdivisés en sous-récits
plus petits, calibrés autour de 3 points (notre récit de référence, voir plus bas).
Un découpage à 5 ou 8 points ne se divise pas toujours en tranches égales de 3 —
dans ce cas, on accepte un reliquat à 2 points plutôt que de forcer un découpage
artificiel qui ne refléterait pas la charge réelle du travail. **Le total de
points par récit d'origine est conservé**, donc la capacité totale par sprint
(voir `04-sprints.md`) ne change pas — seule la granularité augmente, ce qui
facilite le suivi de vélocité et réduit le risque qu'un récit bloque toute une
mêlée sans qu'on puisse mesurer l'avancement partiel.

Convention de numérotation : le premier sous-récit **réutilise le numéro
d'issue GitHub existant** (on édite l'issue en place — titre, critères, points).
Les sous-récits additionnels sont de **nouvelles issues**, numérotées ici en
placeholder à partir de `#24` (prochain numéro disponible) — à remplacer par le
numéro réel attribué par GitHub à la création.

## Les récits `must`, dans l'ordre

| # | Récit | Épique | Points | Sprint |
|---|---|---|---|---|
| [#1](../../../issues/1) | Créer un compte (inscription) | Comptes | 3 | 1 |
| [#28](../../../issues/28) | Se connecter et maintenir ma session | Comptes | 2 | 1 |
| [#2](../../../issues/2) | Créer une salle (nom + disposition de base) | Salles | 3 | 1 |
| [#24](../../../issues/24) | Générer et afficher le plan de sièges individuel | Salles | 3 | 1 |
| [#25](../../../issues/25) | Voir la liste de mes salles | Salles | 2 | 1 |
| [#3](../../../issues/3) | Créer un événement (formulaire de base) | Événements | 3 | 1 |
| [#29](../../../issues/29) | Attribuer une salle existante à l'événement | Événements | 2 | 1 |
| [#4](../../../issues/4) | Voir la liste des événements à venir | Événements | 3 | 1 |
| [#5](../../../issues/5) | Afficher le plan de salle avec l'état des sièges au chargement | Événements | 3 | 1 |
| [#30](../../../issues/30) | Empêcher la sélection d'un siège déjà réservé | Événements | 2 | 1 |
| [#6](../../../issues/6) | Sélectionner et confirmer une réservation (cas nominal) | Réservations | 3 | 1 |
| [#26](../../../issues/26) | Refuser une réservation si un siège a été pris entretemps | Réservations | 3 | 1 |
| [#27](../../../issues/27) | Garantir l'unicité en base contre les réservations concurrentes | Réservations | 2 | 1 |
| [#7](../../../issues/7) | Voir mes réservations | Mes réservations | 3 | 1 |
| [#8](../../../issues/8) | Diffuser en temps réel la sélection d'un siège (WebSocket) | Réservations | 3 | 2 |
| [#31](../../../issues/31) | Empêcher la sélection d'un siège déjà en sélection par un autre | Réservations | 2 | 2 |
| [#32](../../../issues/32) | Libérer automatiquement un siège en sélection non confirmé | Réservations | 3 | 2 |
| [#9](../../../issues/9) | Middleware de vérification de rôle centralisé | Comptes | 3 | 2 |
| [#33](../../../issues/33) | Tester le contournement direct des restrictions par rôle | Comptes | 2 | 2 |
| [#10](../../../issues/10) | Modifier une salle existante tant qu'aucun événement ne l'utilise | Salles | 3 | 2 |
| [#11](../../../issues/11) | Créer des sections nommées avec prix et assigner des sièges | Salles | 3 | 2 |
| [#34](../../../issues/34) | Afficher les sections par couleur sur le plan de salle | Salles | 2 | 2 |
| [#12](../../../issues/12) | Annuler une réservation à venir | Mes réservations | 3 | 2 |
| [#13](../../../issues/13) | Afficher le tableau de bord des ventes (chargement initial) | Suivi organisateur | 3 | 2 |
| [#35](../../../issues/35) | Mettre à jour les statistiques de vente en direct | Suivi organisateur | 2 | 2 |
| [#14](../../../issues/14) | Annuler une réservation en tant qu'organisateur | Suivi organisateur | 3 | 2 |
| [#15](../../../issues/15) | Expiration automatique du délai de sélection (serveur) | Réservations | 3 | 3 |
| [#37](../../../issues/37) | Afficher le compte à rebours et gérer l'expiration pendant la confirmation | Réservations | 2 | 3 |
| [#16](../../../issues/16) | Contrainte DB empêchant deux confirmations sur le même siège | Réservations | 3 | 3 |
| [#38](../../../issues/38) | Test automatisé de confirmation concurrente | Réservations | 3 | 3 |
| [#39](../../../issues/39) | Resynchroniser l'affichage du client dont la confirmation échoue | Réservations | 2 | 3 |
| [#17](../../../issues/17) | Détecter la reconnexion et resynchroniser l'état du plan | Réservations | 3 | 3 |
| [#40](../../../issues/40) | Indicateur visuel de connexion perdue/rétablie + blocage des actions | Réservations | 2 | 3 |
| [#18](../../../issues/18) | Accéder à l'application déployée sur un serveur public | Infrastructure | 3 | 3 |
| [#19](../../../issues/19) | Liste globale des organisateurs (admin) | Administration | 3 | 2 |
| [#36](../../../issues/36) | Liste globale des événements + détail au clic | Administration | 2 | 2 |
| [#20](../../../issues/20) | Suspendre/réactiver un compte (admin) | Administration | 3 | 3 |
| [#41](../../../issues/41) | Bloquer la connexion d'un compte suspendu + règle de visibilité | Administration | 2 | 3 |
| [#42](../../../issues/42) | Naviguer entre les pages via une barre de navigation commune | Infrastructure | 2 | 1 |
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

### [#1](../../../issues/1) — Créer un compte (inscription)
**En tant que** visiteur, **je veux** créer un compte avec un courriel, un mot de passe et un rôle **afin de** pouvoir accéder aux fonctionnalités réservées aux membres selon mon rôle.

**Critères d'acceptation**
- Je peux m'inscrire avec un courriel, un mot de passe et un rôle (organisateur ou spectateur).
- Un courriel déjà utilisé refuse une nouvelle inscription, avec un message clair.
- Le mot de passe est stocké hashé (jamais en clair).

### [#28](../../../issues/28) — Se connecter et maintenir ma session
**En tant qu'**utilisateur inscrit, **je veux** me connecter et rester connecté d'une page à l'autre **afin de** ne pas avoir à ressaisir mes identifiants à chaque navigation.

**Critères d'acceptation**
- Une fois connecté, ma session persiste d'une page à l'autre.
- Un mot de passe incorrect refuse la connexion sans révéler si le courriel existe.

*Dépend de : #1*

### [#2](../../../issues/2) — Créer une salle (nom + disposition de base)
**En tant qu'**organisateur, **je veux** créer une salle en indiquant un nom, un nombre de rangées et de sièges par rangée **afin de** pouvoir la réutiliser pour tous les événements qui s'y tiennent.

**Critères d'acceptation**
- Je peux nommer une salle et définir sa disposition (nombre de rangées, sièges par rangée).
- Une salle sans aucun siège ne peut pas être enregistrée (message d'erreur explicite).
- Contrainte d'unicité `(organisateurId, nom)` respectée.

### [#24](../../../issues/24) — Générer et afficher le plan de sièges individuel
**En tant qu'**organisateur, **je veux** que chaque siège soit généré individuellement et identifié par rangée et numéro **afin de** pouvoir m'y référer précisément lors de la configuration ou du suivi des ventes.

**Critères d'acceptation**
- Le plan généré affiche chaque siège individuellement, identifié par rangée et numéro (ex. A-12).
- Contrainte d'unicité `(salleId, numeroRangee, numeroColonne)` respectée.

*Dépend de : #2*

### [#25](../../../issues/25) — Voir la liste de mes salles
**En tant qu'**organisateur, **je veux** voir la liste des salles que j'ai créées **afin de** pouvoir en attribuer une à un futur événement.

**Critères d'acceptation**
- La salle créée apparaît dans ma liste de salles.
- Seules mes propres salles apparaissent dans ma liste.

*Dépend de : #2*

### [#3](../../../issues/3) — Créer un événement (formulaire de base)
**En tant qu'**organisateur, **je veux** créer un événement avec un titre, une description, une date et un lieu **afin de** préparer la vente de places.

**Critères d'acceptation**
- Un formulaire permet de saisir titre, description, date et lieu ; tous les champs sauf la description sont obligatoires.
- Une date passée est refusée avec un message explicite.
- Un spectateur ne peut pas accéder à ce formulaire (403 côté serveur).

### [#29](../../../issues/29) — Attribuer une salle existante à l'événement
**En tant qu'**organisateur, **je veux** attribuer une salle que j'ai déjà créée à mon événement **afin de** vendre des places sans redéfinir un plan à chaque fois.

**Critères d'acceptation**
- Un menu déroulant liste les salles que j'ai déjà créées ; j'en choisis une pour l'événement.
- Un événement ne peut pas être publié sans salle attribuée.

*Dépend de : #3, #2*

### [#4](../../../issues/4) — Voir la liste des événements à venir
**En tant que** spectateur, **je veux** voir la liste des événements à venir **afin de** choisir celui auquel je veux assister.

**Critères d'acceptation**
- La liste affiche au minimum le titre, la date et le lieu de chaque événement.
- Seuls les événements dont la date n'est pas passée sont affichés.
- Cliquer sur un événement m'amène à son plan de salle.
- La liste est vide (avec un message clair) si aucun événement n'est à venir.

### [#5](../../../issues/5) — Afficher le plan de salle avec l'état des sièges au chargement
**En tant que** spectateur, **je veux** voir le plan de la salle d'un événement avec l'état de chaque siège au chargement de la page **afin de** savoir lesquels sont disponibles.

**Critères d'acceptation**
- Chaque siège affiche visuellement son état : libre ou réservé (l'état « en sélection » arrive au sprint 2).
- Le plan reflète l'état réel de la base de données au chargement de la page.

### [#30](../../../issues/30) — Empêcher la sélection d'un siège déjà réservé
**En tant que** spectateur, **je veux** qu'un siège réservé ne soit pas cliquable **afin de** ne pas tenter une réservation vouée à l'échec.

**Critères d'acceptation**
- Un siège réservé n'est pas cliquable pour une nouvelle réservation.

*Dépend de : #5*

### [#6](../../../issues/6) — Sélectionner et confirmer une réservation (cas nominal)
**En tant que** spectateur, **je veux** sélectionner un ou plusieurs sièges libres puis confirmer en une action **afin de** m'assurer une place à l'événement.

**Critères d'acceptation**
- Je peux sélectionner un ou plusieurs sièges libres puis confirmer en une action.
- Une fois confirmés, les sièges passent à l'état « réservé », associés à mon compte, et une confirmation visuelle claire m'est montrée.

### [#26](../../../issues/26) — Refuser une réservation si un siège a été pris entretemps
**En tant que** spectateur, **je veux** être averti si un siège que j'ai sélectionné a été pris entretemps **afin de** ne pas croire ma réservation confirmée à tort.

**Critères d'acceptation**
- Si un siège sélectionné a été réservé par quelqu'un d'autre entre l'affichage et ma confirmation, ma tentative est refusée avec un message explicite.

*Dépend de : #6*

### [#27](../../../issues/27) — Garantir l'unicité en base contre les réservations concurrentes
**En tant qu'**équipe technique, **je veux** une contrainte d'unicité en base sur `(siegeId, evenementId)` **afin de** garantir qu'un même siège ne soit jamais associé à deux réservations, même en cas de requêtes simultanées.

**Critères d'acceptation**
- Une contrainte d'unicité en base empêche qu'un même siège soit associé à deux réservations, même en cas de requêtes simultanées.

*Dépend de : #6*

### [#7](../../../issues/7) — Voir mes réservations
**En tant que** spectateur, **je veux** voir la liste de mes réservations **afin de** retrouver mes places pour mes événements à venir.

**Critères d'acceptation**
- La liste affiche, pour chaque réservation, l'événement, la date et les sièges réservés.
- Seules mes propres réservations apparaissent.
- Une réservation pour un événement passé est indiquée comme telle (ex. libellé « terminé »).

## Récits du sprint 2 (avec critères d'acceptation)

### [#8](../../../issues/8) — Diffuser en temps réel la sélection d'un siège (WebSocket)
**En tant que** spectateur, **je veux** voir un siège passer à l'état « en sélection » en temps réel dès qu'un autre spectateur le choisit **afin de** ne pas perdre de temps sur un siège déjà pris.

**Critères d'acceptation**
- Dès qu'un spectateur clique sur un siège libre, tous les autres spectateurs consultant le même plan voient ce siège passer à « en sélection » en quelques secondes, sans recharger la page.
- La mise à jour utilise un mécanisme temps réel (WebSocket), pas un rafraîchissement périodique par sondage agressif.

### [#31](../../../issues/31) — Empêcher la sélection d'un siège déjà en sélection par un autre
**En tant que** spectateur, **je veux** qu'un siège « en sélection » ne soit pas cliquable par les autres **afin d'**éviter les conflits de sélection.

**Critères d'acceptation**
- Un siège « en sélection » n'est pas cliquable par les autres spectateurs.

*Dépend de : #8*

### [#32](../../../issues/32) — Libérer automatiquement un siège en sélection non confirmé
**En tant que** spectateur, **je veux** qu'un siège redevienne libre si celui qui l'a sélectionné annule ou quitte **afin de** ne pas voir un siège bloqué indéfiniment.

**Critères d'acceptation**
- Si le spectateur qui a sélectionné le siège ne confirme pas (annule ou quitte), le siège redevient visible comme libre pour tout le monde.

*Dépend de : #8*

### [#9](../../../issues/9) — Middleware de vérification de rôle centralisé
**En tant qu'**utilisateur du système (tout rôle), **je veux** que chaque action soit vérifiée selon mon rôle directement côté serveur, via un middleware centralisé, **afin de** garantir qu'aucun utilisateur ne puisse contourner les restrictions.

**Critères d'acceptation**
- Une requête tentant une action réservée à l'organisateur ou à l'administrateur est refusée par le serveur si l'utilisateur n'a pas ce rôle.
- Le refus renvoie un code d'erreur clair (403) sans révéler de détails sensibles.
- Les vérifications de rôle sont centralisées (middleware), pas dupliquées dans chaque route.

### [#33](../../../issues/33) — Tester le contournement direct des restrictions par rôle
**En tant qu'**équipe technique, **je veux** des tests qui envoient des requêtes directement (sans passer par l'interface) **afin de** valider que le middleware de rôle ne peut pas être contourné.

**Critères d'acceptation**
- Un test automatisé confirme qu'une requête réservée à l'organisateur échoue pour un compte spectateur, envoyée directement.
- Un test automatisé confirme qu'une requête réservée à l'administrateur échoue pour un compte organisateur ou spectateur.

*Dépend de : #9*

### [#10](../../../issues/10) — Modifier une salle existante tant qu'aucun événement ne l'utilise
**En tant qu'**organisateur, **je veux** modifier la disposition d'une salle que j'ai créée, tant qu'aucun événement ne l'utilise encore, **afin de** corriger une erreur de configuration avant sa première utilisation.

**Critères d'acceptation**
- Je peux modifier le nom et la disposition (rangées, sièges) d'une salle qui n'est associée à aucun événement.
- Une salle déjà associée à au moins un événement ne peut pas être modifiée ; un message explicite en indique la raison.
- Les modifications sont immédiatement reflétées dans le plan de la salle.
- Une salle vidée de tous ses sièges via l'édition ne peut pas être enregistrée (même règle qu'à la création).

### [#11](../../../issues/11) — Créer des sections nommées avec prix et assigner des sièges
**En tant qu'**organisateur, **je veux** diviser une salle en sections nommées à tarifs différents **afin de** pouvoir vendre des places à des prix distincts selon leur emplacement.

**Critères d'acceptation**
- Je peux assigner un groupe de sièges à une section nommée, avec un prix associé.
- Chaque siège appartient à une seule section à la fois.

### [#34](../../../issues/34) — Afficher les sections par couleur sur le plan de salle
**En tant qu'**organisateur ou spectateur, **je veux** voir les sections affichées par couleur sur le plan de salle **afin de** distinguer visuellement les tarifs.

**Critères d'acceptation**
- Le plan de salle affiche visuellement les sections (par couleur) pour l'organisateur et pour le spectateur.
- Une salle sans section définie utilise un tarif unique par défaut.

*Dépend de : #11*

### [#12](../../../issues/12) — Annuler une réservation à venir
**En tant que** spectateur, **je veux** annuler une réservation à venir **afin de** libérer mes sièges si je ne peux plus assister à l'événement.

**Critères d'acceptation**
- Je peux annuler une réservation seulement si l'événement n'a pas encore eu lieu.
- Une fois annulée, les sièges concernés redeviennent immédiatement disponibles pour les autres spectateurs.
- La réservation annulée est retirée de ma liste active de réservations (ou marquée comme annulée, selon le choix d'affichage retenu).
- Une tentative d'annuler une réservation qui ne m'appartient pas est refusée.

### [#13](../../../issues/13) — Afficher le tableau de bord des ventes (chargement initial)
**En tant qu'**organisateur, **je veux** voir l'état des ventes de mon événement au chargement de la page **afin de** suivre combien de places sont vendues et disponibles.

**Critères d'acceptation**
- Le tableau de bord affiche le nombre de sièges vendus, en sélection, et libres, pour l'événement choisi.
- Je ne peux voir que les statistiques de mes propres événements.

### [#35](../../../issues/35) — Mettre à jour les statistiques de vente en direct
**En tant qu'**organisateur, **je veux** que les chiffres du tableau de bord se mettent à jour sans recharger la page **afin de** suivre les ventes en temps réel.

**Critères d'acceptation**
- Les chiffres se mettent à jour sans que je doive recharger la page.
- Le total affiché correspond en tout temps à l'état réel du plan de salle.

*Dépend de : #13, #8*

### [#14](../../../issues/14) — Annuler une réservation en tant qu'organisateur
**En tant qu'**organisateur, **je veux** pouvoir annuler la réservation d'un spectateur **afin de** résoudre un problème (erreur, abus, demande du spectateur) sans devoir intervenir directement en base de données.

**Critères d'acceptation**
- Je peux annuler n'importe quelle réservation liée à un de mes événements, avec un motif optionnel.
- Le siège annulé redevient disponible immédiatement.
- Le spectateur concerné voit sa réservation annulée dans son propre historique.
- Je ne peux pas annuler une réservation liée à l'événement d'un autre organisateur.

### [#19](../../../issues/19) — Liste globale des organisateurs (admin)
**En tant qu'**administrateur, **je veux** voir la liste de tous les organisateurs inscrits **afin de** superviser l'ensemble de l'activité de la plateforme.

**Critères d'acceptation**
- La liste des organisateurs affiche au minimum leur nom et courriel, et le nombre d'événements créés par chacun.
- Un organisateur ou un spectateur ne peut pas accéder à cette vue.

### [#36](../../../issues/36) — Liste globale des événements + détail au clic
**En tant qu'**administrateur, **je veux** voir tous les événements de la plateforme et accéder au détail de chacun **afin de** superviser l'activité, peu importe qui les a créés.

**Critères d'acceptation**
- La liste des événements affiche tous les événements, avec l'organisateur associé à chacun, sans filtre par mes propres créations.
- Cliquer sur un événement ou un organisateur permet d'en voir le détail.

*Dépend de : #19*

## Récits du sprint 3 (avec critères d'acceptation)

### [#15](../../../issues/15) — Expiration automatique du délai de sélection (serveur)
**En tant que** spectateur, **je veux** que mon siège sélectionné redevienne libre si je ne confirme pas dans un délai raisonnable **afin de** ne pas bloquer un siège indéfiniment.

**Critères d'acceptation**
- Un siège passé en « sélection » redevient automatiquement « libre » si aucune confirmation n'arrive dans le délai fixé (ex. 5 minutes).
- L'expiration du délai est vérifiée côté serveur, pas seulement dans l'interface du client.

### [#37](../../../issues/37) — Afficher le compte à rebours et gérer l'expiration pendant la confirmation
**En tant que** spectateur, **je veux** voir le temps restant avant expiration et être averti si le délai expire pendant ma confirmation **afin de** comprendre pourquoi ma réservation a échoué.

**Critères d'acceptation**
- Le spectateur voit un indicateur du temps restant avant l'expiration.
- Si le délai expire pendant la tentative de confirmation, celle-ci est refusée avec un message clair, et le spectateur doit resélectionner le siège.

*Dépend de : #15*

### [#16](../../../issues/16) — Contrainte DB empêchant deux confirmations sur le même siège
**En tant que** spectateur, **je veux** avoir la certitude qu'un siège que je confirme ne peut pas être attribué à quelqu'un d'autre au même instant **afin d'**éviter les doubles réservations.

**Critères d'acceptation**
- Si deux spectateurs tentent de confirmer le même siège au même moment, une seule confirmation réussit ; l'autre est refusée avec un message explicite.
- La garantie repose sur une contrainte au niveau de la base de données (contrainte d'unicité ou verrou), pas seulement sur une vérification applicative.

### [#38](../../../issues/38) — Test automatisé de confirmation concurrente
**En tant qu'**équipe technique, **je veux** un test automatisé simulant deux confirmations simultanées **afin de** garantir que la contrainte de concurrence fonctionne réellement, en continu.

**Critères d'acceptation**
- Un test simulant des requêtes concurrentes confirme qu'aucun siège ne peut se retrouver associé à deux réservations actives.
- Ce test est intégré à la chaîne CI.

*Dépend de : #16*

### [#39](../../../issues/39) — Resynchroniser l'affichage du client dont la confirmation échoue
**En tant que** spectateur dont la confirmation a échoué, **je veux** voir l'état à jour du siège sans recharger manuellement **afin de** comprendre immédiatement pourquoi ma tentative a échoué.

**Critères d'acceptation**
- Le spectateur dont la confirmation échoue voit l'état à jour du siège sans devoir recharger manuellement.

*Dépend de : #16*

### [#17](../../../issues/17) — Détecter la reconnexion et resynchroniser l'état du plan
**En tant que** spectateur, **je veux** que mon affichage se resynchronise automatiquement après une coupure de connexion **afin de** ne pas prendre de décision sur un plan de salle obsolète.

**Critères d'acceptation**
- Après une coupure suivie d'une reconnexion, l'application détecte la reconnexion et redemande l'état actuel du plan de salle.
- L'affichage des sièges reflète l'état réel après resynchronisation, y compris les changements survenus pendant la coupure.

### [#40](../../../issues/40) — Indicateur visuel de connexion perdue/rétablie + blocage des actions
**En tant que** spectateur, **je veux** un indicateur visuel de l'état de ma connexion et un blocage des actions pendant la resynchronisation **afin de** ne pas réserver sur un affichage potentiellement obsolète.

**Critères d'acceptation**
- Un indicateur visuel informe le spectateur que la connexion a été perdue puis rétablie.
- Aucune action de réservation n'est possible tant que la resynchronisation n'est pas confirmée.

*Dépend de : #17*

### [#18](../../../issues/18) — Accéder à l'application déployée sur un serveur public
**En tant qu'**utilisateur (tout rôle confondu), **je veux** accéder à l'application via une adresse publique **afin de** pouvoir l'utiliser sans dépendre de l'environnement de développement d'un membre de l'équipe.

**Critères d'acceptation**
- L'application est accessible via une URL publique fonctionnelle, sans configuration locale requise.
- Le frontend et le backend communiquent correctement dans cet environnement déployé (pas seulement en local).
- Une mise à jour poussée sur la branche principale est déployée automatiquement, ou via une procédure documentée et reproductible.
- Les données créées sur l'environnement déployé persistent d'une session à l'autre.

### [#20](../../../issues/20) — Suspendre/réactiver un compte (admin)
**En tant qu'**administrateur, **je veux** suspendre le compte d'un organisateur ou d'un spectateur **afin de** réagir à un abus signalé sans supprimer le compte définitivement.

**Critères d'acceptation**
- Je peux changer le statut d'un compte de « actif » à « suspendu », avec une raison optionnelle enregistrée.
- Seul un administrateur peut suspendre ou réactiver un compte.

### [#41](../../../issues/41) — Bloquer la connexion d'un compte suspendu + règle de visibilité
**En tant que** système, **je veux** empêcher la connexion d'un compte suspendu et appliquer la règle de visibilité de ses événements **afin de** faire respecter la suspension de façon cohérente.

**Critères d'acceptation**
- Un compte suspendu ne peut plus se connecter ; un message clair l'en informe à la tentative de connexion.
- Les événements et salles d'un organisateur suspendu suivent la règle décidée en équipe (visibles ou masqués aux spectateurs — à préciser dans 03-conception.md).

*Dépend de : #20*

### [#21](../../../issues/21) — Filtrer les événements par date ou lieu
**En tant que** spectateur, **je veux** filtrer la liste des événements par date ou par lieu **afin de** trouver plus rapidement un événement qui m'intéresse quand la liste devient longue.

**Critères d'acceptation**
- Je peux filtrer les événements affichés par une plage de dates.
- Je peux filtrer les événements par lieu (ou par salle).
- Les filtres peuvent être combinés.
- L'absence de résultat correspondant affiche un message clair plutôt qu'une liste vide sans explication.

### [#22](../../../issues/22) — Voir des statistiques simples de vente par section
**En tant qu'**organisateur, **je veux** voir des statistiques simples de vente ventilées par section tarifaire **afin de** comprendre quelles sections se vendent le mieux pour ajuster mes futurs événements.

**Critères d'acceptation**
- Pour un événement donné, je vois le nombre de sièges vendus et le revenu généré par section.
- Les statistiques se basent sur les réservations confirmées uniquement, pas les sièges « en sélection ».
- Je ne vois les statistiques que pour mes propres événements.
- Une section sans aucune vente affiche clairement zéro plutôt que d'être omise.
