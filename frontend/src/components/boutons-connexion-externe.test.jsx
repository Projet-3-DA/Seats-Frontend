import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { API_URL } from '@/constants/api';
import { BoutonsConnexionExterne } from './boutons-connexion-externe';

describe('BoutonsConnexionExterne', () => {
  // Jest tourne en environnement mobile : le bouton passe par Linking (sur le web, window.location).
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
  });

  it('affiche un bouton par fournisseur', async () => {
    await render(<BoutonsConnexionExterne />);

    for (const nom of ['GitHub', 'Google', 'Microsoft']) {
      expect(screen.getByText(`Continuer avec ${nom}`)).toBeTruthy();
    }
  });

  it('envoie vers la route GitHub du backend', async () => {
    await render(<BoutonsConnexionExterne />);

    fireEvent.press(screen.getByTestId('connexion-github'));

    expect(Linking.openURL).toHaveBeenCalledWith(`${API_URL}/auth/github`);
  });

  it.each(['google', 'microsoft'])('désactive « %s » tant que le backend ne le gère pas', async (id) => {
    await render(<BoutonsConnexionExterne />);

    const bouton = screen.getByTestId(`connexion-${id}`);
    expect(bouton.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(bouton);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it('annonce les fournisseurs pas encore disponibles', async () => {
    await render(<BoutonsConnexionExterne />);

    expect(screen.getAllByText('Bientôt')).toHaveLength(2);
  });
});
