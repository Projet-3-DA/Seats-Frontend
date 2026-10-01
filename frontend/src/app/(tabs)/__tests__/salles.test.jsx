jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Link: ({ children }) => children,
    useFocusEffect: (callback) => {
      React.useEffect(callback, [callback]);
    },
  };
});
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import MesSallesScreen from '../salles';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

// ponytail: même limitation que events/index.test.jsx — voir ce fichier.
async function attendreQue(predicat, { limiteMs = 5000, intervalleMs = 25 } = {}) {
  const debut = Date.now();
  for (;;) {
    let atteint = false;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, intervalleMs));
      atteint = predicat();
    });
    if (atteint) return;
    if (Date.now() - debut > limiteMs) throw new Error(`attendreQue : condition jamais atteinte après ${limiteMs} ms`);
  }
}

describe('MesSallesScreen (onglet Salles)', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('affiche les salles avec leur capacité, en envoyant le jeton', async () => {
    useAuth.mockReturnValue({ token: 'jeton-orga' });
    global.fetch = jest.fn().mockResolvedValue(
      reponse({ success: true, data: [{ id: 1, nom: 'Petit studio', nombreRangees: 3, siegesParRangee: 6 }] }),
    );

    await render(<MesSallesScreen />);
    await attendreQue(() => screen.queryByText('Petit studio') !== null);

    expect(screen.getByText('3 rangées × 6 sièges · 18 places')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/salles'),
      expect.objectContaining({ headers: { Authorization: 'Bearer jeton-orga' } }),
    );
  });

  it("n'appelle pas l'API tant que le jeton n'est pas disponible", async () => {
    useAuth.mockReturnValue({ token: null });
    global.fetch = jest.fn();

    await render(<MesSallesScreen />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('propose le bouton « + » et un message quand il n\'y a aucune salle', async () => {
    useAuth.mockReturnValue({ token: 'jeton-orga' });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [] }));

    await render(<MesSallesScreen />);
    await attendreQue(() => screen.queryByText("Vous n'avez encore créé aucune salle.") !== null);

    expect(screen.getByLabelText('Créer une salle')).toBeTruthy();
  });
});
