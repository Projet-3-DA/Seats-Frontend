import { formatDateHeure, parseDateHeure } from './dates';

describe('parseDateHeure', () => {
  it.each([
    ['28/10/2026', '20:00'],
    ['1/2/2027', '9h05'],
    ['28/10/2026', '20 h 00'],
  ])('accepte %s à %s', (date, heure) => {
    const resultat = parseDateHeure(date, heure);
    expect(resultat).toBeInstanceOf(Date);
  });

  it('interprète correctement jour, mois, année, heures et minutes', () => {
    const d = parseDateHeure('28/10/2026', '20:05');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 28, 20, 5]);
  });

  it('accepte le 29 février d\'une année bissextile', () => {
    expect(parseDateHeure('29/02/2028', '10:00')).toBeInstanceOf(Date);
  });

  it.each([
    ['31/02/2027', '10:00'], // février n'a pas 31 jours
    ['29/02/2027', '10:00'], // 2027 n'est pas bissextile
    ['28-10-2026', '20:00'], // mauvais séparateur
    ['28/10/2026', '24:00'], // heure invalide
    ['28/10/2026', '20:60'], // minute invalide
    ['', ''],
    ['28/10/2026', ''],
    ['', '20:00'],
    ['pas une date', 'pas une heure'],
  ])('refuse %s à %s (renvoie null)', (date, heure) => {
    expect(parseDateHeure(date, heure)).toBeNull();
  });
});

describe('formatDateHeure', () => {
  it('formate une date ISO en français, avec heure sur 2 chiffres', () => {
    expect(formatDateHeure('2026-10-28T20:05:00')).toBe('28 octobre 2026 à 20h05');
  });

  it('complète les minutes et heures à un chiffre avec un zéro', () => {
    expect(formatDateHeure('2026-01-05T09:03:00')).toBe('5 janvier 2026 à 09h03');
  });
});
