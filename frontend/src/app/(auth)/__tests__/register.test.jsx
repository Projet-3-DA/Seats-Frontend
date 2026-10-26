jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

import { act, render, screen } from '@testing-library/react-native';

import RegisterScreen from '../register';

describe('RegisterScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ success: true, data: ['github'] }) });
  });

  it('propose le choix du rôle et la connexion externe (comme spectateur)', async () => {
    await render(<RegisterScreen />);
    await act(async () => {});

    expect(screen.getByText('Spectateur')).toBeTruthy();
    expect(screen.getByText('Organisateur')).toBeTruthy();
    expect(screen.getByText('ou, comme spectateur')).toBeTruthy();
    expect(screen.getByText('Continuer avec GitHub')).toBeTruthy();
  });
});
