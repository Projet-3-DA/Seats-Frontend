jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import EventSeatMapScreen from '../[id]';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

const plan = {
  evenementId: 1,
  salle: { id: 19, nom: 'Salle A' },
  sieges: [
    { id: 101, rangee: 1, colonne: 1, etat: 'libre' },
    { id: 102, rangee: 1, colonne: 2, etat: 'en_selection' },
    { id: 103, rangee: 1, colonne: 3, etat: 'reserve' },
  ],
};

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
    if (Date.now() - debut > limiteMs) {
      throw new Error(`attendreQue : condition jamais atteinte après ${limiteMs} ms`);
    }
  }
}

describe('EventSeatMapScreen', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('affiche le plan de salle avec les trois états de siège', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByTestId('siege-101')).toBeTruthy();
    expect(screen.getByTestId('siege-102')).toBeTruthy();
    expect(screen.getByTestId('siege-103')).toBeTruthy();
  });

  it("n'affiche pas le bouton Réserver pour un utilisateur non spectateur", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'organisateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText('Réserver')).toBeNull();
    expect(screen.getByText('Connectez-vous en tant que spectateur pour réserver des sièges.')).toBeTruthy();
  });

  it('ignore un clic sur un siège occupé ou en sélection', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-102'));
    await fireEvent.press(screen.getByTestId('siege-103'));

    expect(screen.queryByText('Réserver (1)')).toBeNull();
    expect(screen.getByText('Réserver')).toBeTruthy(); // aucune sélection : le bouton reste vide/désactivé
  });

  it('sélectionne des sièges libres et réserve avec succès', async () => {
    useAuth.mockReturnValue({ token: 'jeton-valide', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    const planApresReservation = {
      ...plan,
      sieges: [{ ...plan.sieges[0], etat: 'en_selection' }, plan.sieges[1], plan.sieges[2]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [{ id: 1, siegeId: 101, statut: 'en_selection' }] }))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresReservation }));
    await fireEvent.press(screen.getByText('Réserver (1)'));

    await attendreQue(() => screen.queryByText(/Sièges réservés/) !== null);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reservations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jeton-valide' }),
        body: JSON.stringify({ evenementId: 1, siegeIds: [101] }),
      }),
    );
  });

  it("affiche l'erreur et rafraîchit le plan si un siège vient d'être pris (409)", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    const planApresConflit = {
      ...plan,
      sieges: [{ ...plan.sieges[0], etat: 'en_selection' }, plan.sieges[1], plan.sieges[2]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Ce siège vient d\'être pris.' }, false))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresConflit }));

    await fireEvent.press(screen.getByText('Réserver (1)'));

    await attendreQue(() => screen.queryByText('Ce siège vient d\'être pris.') !== null);
  });
});
