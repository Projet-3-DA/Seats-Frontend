import { capaciteSalle, groupSiegesParRangee } from './salle';

describe('capaciteSalle', () => {
  it('multiplie le nombre de rangées par le nombre de sièges par rangée', () => {
    expect(capaciteSalle({ nombreRangees: 10, siegesParRangee: 15 })).toBe(150);
  });

  it('renvoie 0 pour une salle sans sièges', () => {
    expect(capaciteSalle({ nombreRangees: 0, siegesParRangee: 15 })).toBe(0);
  });
});

describe('groupSiegesParRangee', () => {
  const sieges = [
    { id: 3, rangee: 1, colonne: 3, etat: 'libre' },
    { id: 1, rangee: 1, colonne: 1, etat: 'reserve' },
    { id: 5, rangee: 2, colonne: 1, etat: 'libre' },
    { id: 2, rangee: 1, colonne: 2, etat: 'libre' },
  ];

  it('regroupe les sièges par numéro de rangée', () => {
    const { rangees } = groupSiegesParRangee(sieges);
    expect(Object.keys(rangees).sort()).toEqual(['1', '2']);
    expect(rangees['1']).toHaveLength(3);
    expect(rangees['2']).toHaveLength(1);
  });

  it('trie les sièges de chaque rangée par colonne', () => {
    const { rangees } = groupSiegesParRangee(sieges);
    expect(rangees['1'].map((s) => s.colonne)).toEqual([1, 2, 3]);
  });

  it('trie les numéros de rangée numériquement (10 après 2, pas avant)', () => {
    const grandeSalle = [
      { id: 1, rangee: 10, colonne: 1 },
      { id: 2, rangee: 2, colonne: 1 },
      { id: 3, rangee: 1, colonne: 1 },
    ];
    const { numerosRangees } = groupSiegesParRangee(grandeSalle);
    expect(numerosRangees).toEqual(['1', '2', '10']);
  });

  it('gère une salle sans sièges', () => {
    expect(groupSiegesParRangee([])).toEqual({ rangees: {}, numerosRangees: [] });
  });
});
