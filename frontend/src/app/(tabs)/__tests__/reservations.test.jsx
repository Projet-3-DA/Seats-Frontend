jest.mock('expo-router', () => ({ Link: ({ children }) => children }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { Alert } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// La confirmation (Alert.alert) lance une chaîne async (Promise.all des annulations, puis rechargement)
// que fireEvent.press ne peut pas attendre lui-même : on force quelques tours de micro-tâches dans un
// act() après l'appui, comme le fait déjà attendreQue pendant son sondage.
async function pressAndFlush(element) {
  await act(async () => {
    fireEvent.press(element);
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

import { useAuth } from '@/lib/auth-context';
import MyReservationsScreen from '../reservations';

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

const evenement = { id: 1, titre: 'Concert de jazz', dateHeure: '2099-11-05T19:00:00Z', tarif: 25, afficheUrl: null };

function reservation(overrides) {
  return {
    id: 1,
    evenementId: 1,
    evenement,
    statut: 'confirmee',
    siege: { id: 101, numeroRangee: 1, numeroColonne: 1 },
    motifAnnulation: null,
    ...overrides,
  };
}

describe('MyReservationsScreen : réservation annulée par l’organisateur (#14)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-spec', user: { id: 5, role: 'spectateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it("affiche la réservation comme annulée avec le motif de l'organisateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          reservation({ id: 1, statut: 'annulee', motifAnnulation: 'Siège endommagé' }),
          reservation({ id: 2, statut: 'annulee', motifAnnulation: 'Siège endommagé', siege: { id: 102, numeroRangee: 1, numeroColonne: 2 } }),
        ],
      }),
    );

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByText('Annulée')).toBeTruthy();
    // Un seul motif affiché même s'il concerne plusieurs sièges
    expect(screen.getByText("Motif de l'annulation : Siège endommagé")).toBeTruthy();
  });

  it("n'affiche pas de motif pour une réservation en cours", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [reservation({})] }));

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.queryByText(/Motif de l'annulation/)).toBeNull();
  });
});

describe('MyReservationsScreen : annuler une réservation à venir (#12)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-spec', user: { id: 5, role: 'spectateur' } });
    // Simule l'appui sur le bouton destructif de la boîte de dialogue de confirmation.
    jest.spyOn(Alert, 'alert').mockImplementation((titre, message, boutons) => {
      const confirmer = boutons.find((b) => b.style === 'destructive');
      confirmer.onPress();
    });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    Alert.alert.mockRestore();
  });

  it('demande confirmation puis annule chaque siège de la réservation', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        reponse({
          success: true,
          data: [
            reservation({ id: 1, siege: { id: 101, numeroRangee: 1, numeroColonne: 1 } }),
            reservation({ id: 2, siege: { id: 102, numeroRangee: 1, numeroColonne: 2 } }),
          ],
        }),
      )
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 1, statut: 'annulee' } }))
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 2, statut: 'annulee' } }))
      .mockResolvedValueOnce(
        reponse({
          success: true,
          data: [
            reservation({ id: 1, statut: 'annulee', siege: { id: 101, numeroRangee: 1, numeroColonne: 1 } }),
            reservation({ id: 2, statut: 'annulee', siege: { id: 102, numeroRangee: 1, numeroColonne: 2 } }),
          ],
        }),
      );

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Annuler') !== null);

    await pressAndFlush(screen.getByText('Annuler'));
    expect(Alert.alert).toHaveBeenCalled();

    await attendreQue(() => screen.queryByText('Annulée') !== null);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reservations/1/annuler'),
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer jeton-spec' } }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reservations/2/annuler'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it("affiche l'erreur du serveur si l'annulation échoue", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [reservation({ id: 1 })] }))
      .mockResolvedValueOnce(reponse({ success: false, error: 'Cet événement a déjà eu lieu.' }, false));

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Annuler') !== null);

    await pressAndFlush(screen.getByText('Annuler'));

    await attendreQue(() => screen.queryByText('Cet événement a déjà eu lieu.') !== null);
  });
});

describe('MyReservationsScreen : prix par section (#11)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-spec', user: { id: 5, role: 'spectateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it('additionne le prix de chaque place (section ou tarif de l\'événement)', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          reservation({ id: 1, prix: 40 }),
          reservation({ id: 2, prix: 25, siege: { id: 102, numeroRangee: 1, numeroColonne: 2 } }),
        ],
      }),
    );

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByText(/^65,00/)).toBeTruthy();
  });

  it("retombe sur le tarif de l'événement si le prix de la place est absent", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [reservation({ id: 1 })] }));

    await render(<MyReservationsScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByText(/^25,00/)).toBeTruthy();
  });
});
