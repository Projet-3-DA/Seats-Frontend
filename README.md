# Seats
C'est une app web de réservation de places pour des projections de films. Un utilisateur peut créer un compte pour voir les films disponibles et réserver une place pour la projection de ce film. Un admin peut ajouter des films dans la base de données et ajouter des projections.
## Démarrer l'application
Seul Docker (et Git) est nécessaire. L'application est répartie sur deux dépôts : `compose.yml` construit l'API à partir de `../Seats-Backend/backend`, il faut donc cloner les deux dépôts **côte à côte**, dans le même dossier parent :

```bash
git clone https://github.com/Projet-3-DA/Seats-Backend.git
git clone https://github.com/Projet-3-DA/Seats-Frontend.git
cd Seats-Frontend
docker compose up --build
```

On obtient l'arborescence suivante :

```text
dossier-parent/
├── Seats-Backend/
└── Seats-Frontend/   ← lancer docker compose ici
```

Puis ouvrir http://localhost:5173 (l'API écoute sur http://localhost:3000/api). Le premier démarrage prend quelques minutes (construction des images). La base de données est créée et migrée automatiquement ; ses données sont conservées dans un volume Docker et survivent à un redémarrage (`docker compose down` puis `docker compose up`). `docker compose down -v` la remet à zéro.

### Comptes de démonstration
Créés automatiquement au démarrage (mot de passe : `Demo1234!`).

| Rôle | Courriel |
|---|---|
| Spectateur | `spectateur@seats.demo` |
| Second spectateur | `spectateur2@seats.demo` |
| Organisateur | `organisateur@seats.demo` |
| Administrateur | `admin@seats.demo` |

### Données de démonstration
Au démarrage, la base contient aussi 2 salles (« Grande salle » 50 sièges, « Petit studio » 18 sièges), 5 événements à venir (avec ou sans affiche, dont un gratuit) et 9 sièges déjà réservés, pour pouvoir naviguer sans rien créer. Ces données sont recréées seulement si elles n'existent pas : un redémarrage ne les duplique pas.

### Lancer les tests
```bash
cd frontend && npm install && npm test
```
Les tests du backend (dépôt Seats-Backend) se lancent avec `npm test` dans son dossier `backend/`.

### Éléments simulés dans cette version alpha
- Les **salles, événements et réservations ci-dessus** sont des données de démonstration.
- Sans affiche fournie, un événement reçoit une **image aléatoire de démonstration** (picsum.photos).
- Le **téléversement d'un fichier** d'affiche demande un stockage Supabase non configuré dans Docker : utiliser un lien d'image.

## Équipe
- Oughlis Yanis
- Illunga Katanga Glodie
- Dossouh Delavie
- Agbloyoe Oladé Junior
## Liens
- [Vision](./docs/01-vision.md)
- [Backlog](./docs/02-backlog.md)
- [Conception](./docs/03-conception.md)
- [Sprints](./docs/04-sprints.md)
- [Equipe](./docs/05-equipe.md)
- [Risques](./docs/06-risques.md)
- [Journal](./docs/journal.md)
