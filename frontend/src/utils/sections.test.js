import { COULEURS_SECTIONS, preparerSections, prochaineCouleur } from './sections';
import { parseTarif } from './tarif';

describe('prochaineCouleur', () => {
  it('prend la première couleur libre', () => {
    expect(prochaineCouleur([])).toBe(COULEURS_SECTIONS[0]);
    expect(prochaineCouleur([{ couleur: COULEURS_SECTIONS[0] }])).toBe(COULEURS_SECTIONS[1]);
  });

  it('recommence la liste quand toutes les couleurs sont prises', () => {
    const toutes = COULEURS_SECTIONS.map((couleur) => ({ couleur }));
    expect(COULEURS_SECTIONS).toContain(prochaineCouleur(toutes));
  });
});

describe('preparerSections (#11)', () => {
  const sections = [
    { cle: 'a', nom: ' Parterre ', prixTexte: '45', couleur: '#2563eb' },
    { cle: 'b', nom: 'Balcon', prixTexte: '25,50', couleur: '#9333ea' },
  ];
  const assignation = new Map([
    [1, 'a'],
    [2, 'a'],
    [3, 'b'],
  ]);

  it('prépare le corps de la requête avec les sièges de chaque section', () => {
    expect(preparerSections(sections, assignation, parseTarif)).toEqual({
      sections: [
        { nom: 'Parterre', prix: 45, couleur: '#2563eb', siegeIds: [1, 2] },
        { nom: 'Balcon', prix: 25.5, couleur: '#9333ea', siegeIds: [3] },
      ],
    });
  });

  it('refuse un nom vide', () => {
    expect(preparerSections([{ ...sections[0], nom: ' ' }], assignation, parseTarif).erreur).toMatch(/nom/);
  });

  it('refuse deux sections du même nom', () => {
    const doublon = [sections[0], { ...sections[1], nom: 'parterre' }];
    expect(preparerSections(doublon, assignation, parseTarif).erreur).toMatch(/Deux sections/);
  });

  it('refuse un prix invalide', () => {
    expect(preparerSections([{ ...sections[0], prixTexte: 'abc' }], assignation, parseTarif).erreur).toMatch(/Prix invalide/);
  });

  it('refuse une section sans siège', () => {
    expect(preparerSections(sections, new Map([[1, 'a']]), parseTarif).erreur).toMatch(/« Balcon » ne contient aucun siège/);
  });
});
