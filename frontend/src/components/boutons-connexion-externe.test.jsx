import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { API_URL } from '@/constants/api';
import { BoutonsConnexionExterne } from './boutons-connexion-externe';

// Affiche les boutons avec la liste des fournisseurs configurés renvoyée par le backend.
async function afficher(reponse) {
  global.fetch = jest.fn().mockImplementation(reponse);
  await render(<BoutonsConnexionExterne />);
  await act(async () => {});
}

const configures = (data) => async () => ({ json: async () => ({ success: true, data }) });

describe('BoutonsConnexionExterne', () => {
  // Jest tourne en environnement mobile : le bouton passe par Linking (sur le web, window.location).
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
  });

  it('affiche un bouton par fournisseur', async () => {
    await afficher(configures(['github']));

    for (const nom of ['GitHub', 'Google', 'Microsoft']) {
      expect(screen.getByText(`Continuer avec ${nom}`)).toBeTruthy();
    }
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/auth/fournisseurs`);
  });

  it.each(['github', 'google'])('envoie vers la route « %s » du backend quand il est configuré', async (id) => {
    await afficher(configures(['github', 'google']));

    fireEvent.press(screen.getByTestId(`connexion-${id}`));

    expect(Linking.openURL).toHaveBeenCalledWith(`${API_URL}/auth/${id}`);
  });

  it('désactive et annonce « Bientôt » les fournisseurs non configurés', async () => {
    await afficher(configures(['github', 'google']));

    const bouton = screen.getByTestId('connexion-microsoft');
    expect(bouton.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(bouton);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(screen.getAllByText('Bientôt')).toHaveLength(1);
  });

  it('désactive tous les boutons si le backend est injoignable', async () => {
    await afficher(async () => {
      throw new Error('réseau');
    });

    expect(screen.getAllByText('Bientôt')).toHaveLength(3);
  });
});
