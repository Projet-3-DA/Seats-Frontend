jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  router: { replace: jest.fn() },
}));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useAuth } from '@/lib/auth-context';
import LoginScreen from '../login';

const MESSAGE_SUSPENDU =
  "Ce compte est suspendu. Contactez l'administrateur de la plateforme si vous pensez qu'il s'agit d'une erreur.";

async function seConnecter(email, motDePasse) {
  await render(<LoginScreen />);
  await act(async () => {});
  await act(async () => fireEvent.changeText(screen.getByPlaceholderText('votre@email.com'), email));
  await act(async () => fireEvent.changeText(screen.getByPlaceholderText('••••••••'), motDePasse));
  // « Se connecter » est aussi le titre de l'écran : le bouton est le dernier.
  await act(async () => fireEvent.press(screen.getAllByText('Se connecter').at(-1)));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Les boutons de connexion externe demandent la liste des fournisseurs disponibles.
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true, data: [] }) });
  });

  it('connecte puis ouvre la liste des événements', async () => {
    const login = jest.fn().mockResolvedValue();
    useAuth.mockReturnValue({ login });

    await seConnecter('a@exemple.com ', 'secret');

    expect(login).toHaveBeenCalledWith('a@exemple.com', 'secret');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/events');
  });

  it("affiche clairement qu'un compte suspendu ne peut plus se connecter (#41)", async () => {
    useAuth.mockReturnValue({ login: jest.fn().mockRejectedValue(new Error(MESSAGE_SUSPENDU)) });

    await seConnecter('suspendu@exemple.com', 'secret');

    expect(screen.getByText(MESSAGE_SUSPENDU)).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
