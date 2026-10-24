import { formatMontant, formatTarif, parseTarif } from './tarif';

// Intl.NumberFormat insère une espace insécable avant "$" (fr-CA) : on la normalise en
// espace classique (\s couvre aussi l'insécable) pour ne pas dépendre d'un caractère
// invisible dans les assertions.
function normaliserEspaces(texte) {
  return texte.replace(/\s/g, ' ');
}

describe('formatTarif', () => {
  it("affiche 'Gratuit' quand le tarif est null (événement gratuit)", () => {
    expect(formatTarif(null)).toBe('Gratuit');
  });

  it("affiche 'Gratuit' quand le tarif est undefined", () => {
    expect(formatTarif(undefined)).toBe('Gratuit');
  });

  it('formate un tarif Decimal (sérialisé en string par Prisma) en devise CAD', () => {
    expect(normaliserEspaces(formatTarif('25.00'))).toBe('25,00 $');
  });

  it('formate un tarif numérique directement', () => {
    expect(normaliserEspaces(formatTarif(9.5))).toBe('9,50 $');
  });

  it.each([['0.00'], ['0'], [0]])("affiche 'Gratuit' pour un tarif à zéro (%p)", (tarif) => {
    expect(formatTarif(tarif)).toBe('Gratuit');
  });

  it('affiche un tarif de quelques cents comme un prix, pas comme gratuit', () => {
    expect(normaliserEspaces(formatTarif('0.50'))).toBe('0,50 $');
  });
});

describe('parseTarif', () => {
  it('accepte un entier, une virgule ou un point décimal', () => {
    expect(parseTarif('25')).toBe(25);
    expect(parseTarif(' 25,5 ')).toBe(25.5);
    expect(parseTarif('25.50')).toBe(25.5);
  });

  it('refuse un texte, plus de 2 décimales ou un montant négatif', () => {
    expect(parseTarif('abc')).toBeNull();
    expect(parseTarif('10,123')).toBeNull();
    expect(parseTarif('-5')).toBeNull();
    expect(parseTarif('')).toBeNull();
  });
});

describe('formatMontant', () => {
  it('formate un montant en dollars canadiens, y compris 0', () => {
    expect(normaliserEspaces(formatMontant(40))).toBe('40,00 $');
    expect(normaliserEspaces(formatMontant(0))).toBe('0,00 $');
  });
});
