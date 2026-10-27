jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { API_URL } from '@/constants/api';
import RegisterScreen from '../register';

async function afficher() {
  await render(<RegisterScreen />);
  await act(async () => {});
}

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true, data: ['github'] }) });
  });

  it('propose le choix du rôle et la connexion externe, comme spectateur par défaut', async () => {
    await afficher();

    expect(screen.getByText('Spectateur')).toBeTruthy();
    expect(screen.getByText('Organisateur')).toBeTruthy();
    expect(screen.getByText('ou, comme spectateur')).toBeTruthy();

    fireEvent.press(screen.getByTestId('connexion-github'));
    expect(Linking.openURL).toHaveBeenCalledWith(`${API_URL}/auth/github?role=spectateur`);
  });

  it('transmet le rôle organisateur choisi à la connexion externe', async () => {
    await afficher();

    await act(async () => {
      fireEvent.press(screen.getByText('Organisateur'));
    });

    expect(screen.getByText('ou, comme organisateur')).toBeTruthy();
    fireEvent.press(screen.getByTestId('connexion-github'));
    expect(Linking.openURL).toHaveBeenCalledWith(`${API_URL}/auth/github?role=organisateur`);
  });
});
