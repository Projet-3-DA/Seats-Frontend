import { filtrerEvenements, parseDate, sallesDisponibles } from './filtres-evenements';

const theatre = { nom: 'Théâtre A' };
const salleB = { nom: 'Salle B' };
const jazz = { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00', salleId: 1, salle: theatre };
const rock = { id: 2, titre: 'Concert Rock', dateHeure: '2026-11-01T21:00:00', salleId: 2, salle: salleB };
const opera = { id: 3, titre: 'Opéra', dateHeure: '2026-11-15T19:30:00', salleId: 1, salle: theatre };
const tous = [jazz, rock, opera];

describe('parseDate', () => {
  it('lit une date JJ/MM/AAAA à minuit, en heure locale', () => {
    expect(parseDate(' 01/11/2026 ')).toEqual(new Date(2026, 10, 1));
  });

  it.each([[''], ['2026-11-01'], ['1/11'], ['31/02/2026'], ['00/11/2026']])('refuse %p', (texte) => {
    expect(parseDate(texte)).toBeNull();
  });
});

describe('sallesDisponibles', () => {
  it('renvoie chaque salle une seule fois, triée par nom', () => {
    expect(sallesDisponibles(tous)).toEqual([
      { id: 2, nom: 'Salle B' },
      { id: 1, nom: 'Théâtre A' },
    ]);
  });

  it('ignore les événements sans salle', () => {
    expect(sallesDisponibles([{ id: 4, titre: 'Sans salle', dateHeure: '2026-11-01T21:00:00' }])).toEqual([]);
  });
});

describe('filtrerEvenements', () => {
  it('renvoie tout sans critère', () => {
    expect(filtrerEvenements(tous)).toEqual(tous);
  });

  it('filtre par salle', () => {
    expect(filtrerEvenements(tous, { salleId: 1 })).toEqual([jazz, opera]);
  });

  it('filtre par plage de dates, la date de fin étant incluse', () => {
    const du = new Date(2026, 9, 29);
    const au = new Date(2026, 10, 1);
    expect(filtrerEvenements(tous, { du, au })).toEqual([rock]);
  });

  it('accepte une plage ouverte (seulement « du » ou seulement « au »)', () => {
    expect(filtrerEvenements(tous, { du: new Date(2026, 10, 1) })).toEqual([rock, opera]);
    expect(filtrerEvenements(tous, { au: new Date(2026, 9, 28) })).toEqual([jazz]);
  });

  it('combine titre, salle et dates', () => {
    const criteres = { recherche: 'op', salleId: 1, du: new Date(2026, 10, 1), au: new Date(2026, 10, 30) };
    expect(filtrerEvenements(tous, criteres)).toEqual([opera]);
    expect(filtrerEvenements(tous, { ...criteres, salleId: 2 })).toEqual([]);
  });
});
