const { test } = require('node:test');
const assert = require('node:assert/strict');
const { capaciteSalle, groupSiegesParRangee } = require('./salle');

test('capaciteSalle() multiplie le nombre de rangées par le nombre de sièges par rangée', () => {
  assert.equal(capaciteSalle({ nombreRangees: 10, siegesParRangee: 15 }), 150);
});

test('capaciteSalle() renvoie 0 pour une salle sans sièges', () => {
  assert.equal(capaciteSalle({ nombreRangees: 0, siegesParRangee: 15 }), 0);
});

const sieges = [
  { id: 3, rangee: 1, colonne: 3, etat: 'libre' },
  { id: 1, rangee: 1, colonne: 1, etat: 'reserve' },
  { id: 5, rangee: 2, colonne: 1, etat: 'libre' },
  { id: 2, rangee: 1, colonne: 2, etat: 'libre' },
];

test('groupSiegesParRangee() regroupe les sièges par numéro de rangée', () => {
  const { rangees } = groupSiegesParRangee(sieges);
  assert.deepEqual(Object.keys(rangees).sort(), ['1', '2']);
  assert.equal(rangees['1'].length, 3);
  assert.equal(rangees['2'].length, 1);
});

test('groupSiegesParRangee() trie les sièges de chaque rangée par colonne', () => {
  const { rangees } = groupSiegesParRangee(sieges);
  assert.deepEqual(rangees['1'].map((s) => s.colonne), [1, 2, 3]);
});

test('groupSiegesParRangee() trie les numéros de rangée numériquement (10 après 2, pas avant)', () => {
  const grandeSalle = [
    { id: 1, rangee: 10, colonne: 1 },
    { id: 2, rangee: 2, colonne: 1 },
    { id: 3, rangee: 1, colonne: 1 },
  ];
  const { numerosRangees } = groupSiegesParRangee(grandeSalle);
  assert.deepEqual(numerosRangees, ['1', '2', '10']);
});

test('groupSiegesParRangee() gère une salle sans sièges', () => {
  assert.deepEqual(groupSiegesParRangee([]), { rangees: {}, numerosRangees: [] });
});
