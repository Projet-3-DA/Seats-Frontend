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
