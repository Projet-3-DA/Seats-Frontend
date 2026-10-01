import { formatTarif } from './tarif';

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
