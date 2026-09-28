jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
// Le vrai comportement d'Expo Router (redirection, historique) est vérifié dans le navigateur ; ici on
// vérifie seulement quand NOTRE code ouvre ou ferme la garde des écrans d'authentification.
jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  const Stack = ({ children }) => children;
  Stack.Protected = ({ guard, children }) => (
    <>
      <Text testID="garde-auth">{guard ? 'ouverte' : 'fermee'}</Text>
      {children}
    </>
  );
  Stack.Screen = () => null;
  return { Stack };
});

import { render, screen } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import { NavigationRacine } from './navigation-racine';

async function etatGarde() {
  await render(<NavigationRacine />);
  return screen.getByTestId('garde-auth').props.children;
}

describe('NavigationRacine', () => {
  it('ferme les écrans d\'authentification à un utilisateur connecté (plus de retour vers /login)', async () => {
    useAuth.mockReturnValue({ user: { id: 1 }, chargementInitial: false });

    await expect(etatGarde()).resolves.toBe('fermee');
  });

  it('laisse les écrans d\'authentification ouverts à un utilisateur non connecté', async () => {
    useAuth.mockReturnValue({ user: null, chargementInitial: false });

    await expect(etatGarde()).resolves.toBe('ouverte');
  });

  it("garde les écrans d'authentification ouverts tant que la session sauvegardée n'est pas relue", async () => {
    useAuth.mockReturnValue({ user: null, chargementInitial: true });

    await expect(etatGarde()).resolves.toBe('ouverte');
  });
});
