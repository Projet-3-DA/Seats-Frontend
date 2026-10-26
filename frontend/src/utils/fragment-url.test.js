import { lireEtEffacerFragment } from './fragment-url';

function fausseFenetre(hash) {
  return { location: { hash, pathname: '/connexion-externe' }, history: { replaceState: jest.fn() } };
}

describe('lireEtEffacerFragment', () => {
  it('lit les paramètres du fragment et l\'efface de l\'URL', () => {
    const fenetre = fausseFenetre('#token=abc&x=1');

    const params = lireEtEffacerFragment(fenetre);

    expect(params.get('token')).toBe('abc');
    expect(fenetre.history.replaceState).toHaveBeenCalledWith(null, '', '/connexion-externe');
  });

  it('décode un message d\'erreur', () => {
    const params = lireEtEffacerFragment(fausseFenetre(`#erreur=${encodeURIComponent('Connexion annulée.')}`));
    expect(params.get('erreur')).toBe('Connexion annulée.');
  });

  it('renvoie des paramètres vides sans fragment ni fenêtre', () => {
    expect(lireEtEffacerFragment(fausseFenetre('')).get('token')).toBeNull();
    expect(lireEtEffacerFragment(undefined).get('token')).toBeNull();
  });
});
