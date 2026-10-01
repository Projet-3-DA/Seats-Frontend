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

  it('affiche le plan de salle avec les sièges libres et réservés', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByTestId('siege-101')).toBeTruthy();
    expect(screen.getByTestId('siege-103')).toBeTruthy();
  });

  it("n'affiche pas le bouton Réserver pour un utilisateur non spectateur", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'organisateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText('Réserver')).toBeNull();
    expect(
      screen.getByText('Plan en consultation seulement : la réservation est réservée aux spectateurs.'),
    ).toBeTruthy();
    expect(screen.queryByText('Connectez-vous en tant que spectateur pour réserver des sièges.')).toBeNull();
  });

  it('invite un visiteur non connecté à se connecter pour réserver (#87)', async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText('Réserver')).toBeNull();
    expect(screen.getByText('Connectez-vous en tant que spectateur pour réserver des sièges.')).toBeTruthy();
  });

  it('signale un événement terminé et ne permet pas de réserver (#82)', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planPasse = { ...plan, dateHeure: new Date(Date.now() - 86_400_000).toISOString() };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planPasse }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByText("Événement terminé : il n'est plus possible de réserver.")).toBeTruthy();
    expect(screen.queryByText('Réserver')).toBeNull();
    await fireEvent.press(screen.getByTestId('siege-101'));
    expect(screen.queryByText('Réserver (1)')).toBeNull();
  });

  it('ignore un clic sur un siège occupé', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

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

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [{ id: 1, siegeId: 101, statut: 'en_selection' }] }))
      .mockResolvedValueOnce(reponse({ success: true, data: plan }));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Réservation confirmée !') !== null);

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
      sieges: [{ ...plan.sieges[0], etat: 'reserve' }, plan.sieges[1]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Ce siège vient d\'être pris.' }, false))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresConflit }));

    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Ce siège vient d\'être pris.') !== null);

    // Le siège pris entretemps n'est plus dans la sélection : impossible de rester bloqué dessus.
    expect(screen.queryByText('Réserver (1)')).toBeNull();
    expect(screen.getByText('Réserver')).toBeTruthy();
  });

  it('retire de la sélection uniquement les sièges pris entretemps, garde les autres sélectionnés', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planDeuxLibres = {
      ...plan,
      sieges: [plan.sieges[0], { id: 104, rangee: 1, colonne: 4, etat: 'libre' }, plan.sieges[1]],
    };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxLibres }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByTestId('siege-104'));
    await attendreQue(() => screen.queryByText('Réserver (2)') !== null);

    // Le siège 101 vient d'être pris par quelqu'un d'autre ; le 104 est toujours libre.
    const planApresConflit = {
      ...planDeuxLibres,
      sieges: [{ ...planDeuxLibres.sieges[0], etat: 'reserve' }, planDeuxLibres.sieges[1], planDeuxLibres.sieges[2]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Ce siège vient d\'être pris.' }, false))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresConflit }));

    await fireEvent.press(screen.getByText('Réserver (2)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);
    expect(screen.getByTestId('siege-101').props.accessibilityState?.disabled).toBe(true);
  });

  it("affiche la lettre de chaque rangée de part et d'autre du plan", async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    const planDeuxRangees = { ...plan, sieges: [...plan.sieges, { id: 201, rangee: 2, colonne: 1, etat: 'libre' }] };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxRangees }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getAllByText('B')).toHaveLength(2);
  });

  it("n'enregistre rien avant « Confirmer » : « Réserver » n'ouvre que le récapitulatif", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Réserver (1)'));

    expect(screen.getByText('Confirmer votre réservation')).toBeTruthy();
    expect(screen.getByText('Rangée A, siège 1')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1); // seulement le chargement du plan, aucun POST
    expect(global.fetch.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });

  it('« Modifier ma sélection » revient à la sélection sans rien envoyer et garde les sièges choisis', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Modifier ma sélection'));

    expect(screen.queryByText('Confirmer votre réservation')).toBeNull();
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
