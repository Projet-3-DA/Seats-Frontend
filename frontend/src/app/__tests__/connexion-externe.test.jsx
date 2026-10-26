const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  router: { replace: (...args) => mockReplace(...args) },
}));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/utils/fragment-url', () => ({ lireEtEffacerFragment: jest.fn() }));

import { act, render, screen } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import { lireEtEffacerFragment } from '@/utils/fragment-url';
import ConnexionExterneScreen from '../connexion-externe';

async function afficherAvecFragment(fragment) {
  lireEtEffacerFragment.mockReturnValue(new URLSearchParams(fragment.slice(1)));
  await render(<ConnexionExterneScreen />);
  await act(async () => {});
}

describe('ConnexionExterneScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connecte avec le token reçu et redirige vers les événements', async () => {
    const loginAvecToken = jest.fn().mockResolvedValue();
    useAuth.mockReturnValue({ loginAvecToken });

    await afficherAvecFragment('#token=jwt-abc');

    expect(loginAvecToken).toHaveBeenCalledWith('jwt-abc');
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/events');
  });

  it('affiche l\'erreur renvoyée par le backend', async () => {
    const loginAvecToken = jest.fn();
    useAuth.mockReturnValue({ loginAvecToken });

    await afficherAvecFragment(`#erreur=${encodeURIComponent('Connexion GitHub annulée.')}`);

    expect(loginAvecToken).not.toHaveBeenCalled();
    expect(screen.getByText('Connexion GitHub annulée.')).toBeTruthy();
    expect(screen.getByText('Retour à la connexion')).toBeTruthy();
  });

  it('affiche une erreur si le token est refusé', async () => {
    useAuth.mockReturnValue({ loginAvecToken: jest.fn().mockRejectedValue(new Error('Token invalide')) });

    await afficherAvecFragment('#token=mauvais');

    expect(screen.getByText('Token invalide')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
