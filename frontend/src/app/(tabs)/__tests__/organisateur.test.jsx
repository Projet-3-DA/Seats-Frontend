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
import MesEvenementsScreen from '../organisateur';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

// ponytail: même limitation que events/index.test.jsx — `findByText` ne se résout jamais avec le
// test-renderer de ce projet, on sonde donc nous-mêmes en vrai temps.
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

describe('MesEvenementsScreen (onglet Organiser)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 7, role: 'organisateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it("n'affiche que les événements de l'organisateur connecté", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          { id: 1, organisateurId: 7, titre: 'Mon festival', dateHeure: '2026-10-28T20:00:00', tarif: '25.00', salle: { nom: 'Grande salle' } },
          { id: 2, organisateurId: 8, titre: "Festival d'un autre", dateHeure: '2026-11-01T21:00:00', tarif: '10.00' },
        ],
      }),
    );

    await render(<MesEvenementsScreen />);
    await attendreQue(() => screen.queryByText('Mon festival') !== null);

    expect(screen.getByText('Grande salle')).toBeTruthy();
    expect(screen.getByText('25,00 $')).toBeTruthy();
    expect(screen.queryByText("Festival d'un autre")).toBeNull();
  });

  it('propose le bouton « + » pour créer un événement', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [] }));

    await render(<MesEvenementsScreen />);
    await attendreQue(() => screen.queryByText("Vous n'avez encore créé aucun événement.") !== null);

    expect(screen.getByLabelText('Créer un événement')).toBeTruthy();
  });

  it('affiche le message renvoyé par l\'API en cas d\'erreur', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: false, error: 'Panne serveur' }, false));

    await render(<MesEvenementsScreen />);
    await attendreQue(() => screen.queryByText('Panne serveur') !== null);
  });
});
