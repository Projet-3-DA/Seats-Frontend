const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatDateHeure, parseDateHeure } = require('./dates');

const casValides = [
  ['28/10/2026', '20:00'],
  ['1/2/2027', '9h05'],
  ['28/10/2026', '20 h 00'],
];
for (const [date, heure] of casValides) {
  test(`parseDateHeure() accepte ${date} à ${heure}`, () => {
    assert.ok(parseDateHeure(date, heure) instanceof Date);
  });
}

test('parseDateHeure() interprète correctement jour, mois, année, heures et minutes', () => {
  const d = parseDateHeure('28/10/2026', '20:05');
  assert.deepEqual(
    [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()],
    [2026, 9, 28, 20, 5],
  );
});

test('parseDateHeure() accepte le 29 février d\'une année bissextile', () => {
  assert.ok(parseDateHeure('29/02/2028', '10:00') instanceof Date);
});

const casInvalides = [
  ['31/02/2027', '10:00'], // février n'a pas 31 jours
  ['29/02/2027', '10:00'], // 2027 n'est pas bissextile
  ['28-10-2026', '20:00'], // mauvais séparateur
  ['28/10/2026', '24:00'], // heure invalide
  ['28/10/2026', '20:60'], // minute invalide
  ['', ''],
  ['28/10/2026', ''],
  ['', '20:00'],
  ['pas une date', 'pas une heure'],
];
for (const [date, heure] of casInvalides) {
  test(`parseDateHeure() refuse ${JSON.stringify(date)} à ${JSON.stringify(heure)} (renvoie null)`, () => {
    assert.equal(parseDateHeure(date, heure), null);
  });
}

test('formatDateHeure() formate une date ISO en français, avec heure sur 2 chiffres', () => {
  assert.equal(formatDateHeure('2026-10-28T20:05:00'), '28 octobre 2026 à 20h05');
});

test('formatDateHeure() complète les minutes et heures à un chiffre avec un zéro', () => {
  assert.equal(formatDateHeure('2026-01-05T09:03:00'), '5 janvier 2026 à 09h03');
});
