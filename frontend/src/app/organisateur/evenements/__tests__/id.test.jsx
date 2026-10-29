jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { io } from 'socket.io-client';

import { useAuth } from '@/lib/auth-context';
import VentesEvenementScreen from '../[id]';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

// Fausse connexion Socket.IO (#35) : `declencher` simule un événement reçu du serveur, les appels à
// `on`/`emit`/`disconnect` sont espionnables comme sur le vrai client.
function socketFactice() {
  const ecouteurs = {};
  const socket = {
    on: jest.fn((evt, cb) => {
      ecouteurs[evt] = cb;
      // Simule la connexion asynchrone réelle, un instant après l'écoute posée par le composant.
      if (evt === 'connect') Promise.resolve().then(() => cb());
    }),
    emit: jest.fn((evt, donnees, ack) => {
      if (evt === 'ventes:rejoindre') ack?.({ ok: true });
    }),
    disconnect: jest.fn(),
    declencher: (evt, payload) => ecouteurs[evt]?.(payload),
  };
  return socket;
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

function ventes({ vendus = 2, enSelection = 1, libres = 1, recette = 50 } = {}) {
  return {
    evenement: { id: 1, titre: 'Concert de jazz', dateHeure: '2099-11-05T19:00:00Z', tarif: 25 },
    salle: { id: 19, nom: 'Grande salle' },
    totaux: { total: vendus + enSelection + libres, vendus, enSelection, libres },
    recette,
    sieges: [
      {
        id: 101,
        rangee: 1,
        colonne: 1,
        etat: 'vendu',
        reservation: { id: 55, spectateur: { prenom: 'Ana', nom: 'Roy', email: 'ana@test.ca' } },
      },
      {
        id: 102,
        rangee: 1,
        colonne: 2,
        etat: 'en_selection',
        reservation: { id: 56, spectateur: { prenom: 'Léo', nom: 'Gagnon', email: 'leo@test.ca' } },
      },
      { id: 103, rangee: 2, colonne: 1, etat: 'libre' },
    ],
  };
}

describe('VentesEvenementScreen (#13)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
    io.mockReset().mockReturnValue(socketFactice());
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it("charge les ventes de l'événement avec le jeton de l'organisateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/evenements/1/ventes'), {
      headers: { Authorization: 'Bearer jeton-orga' },
    });
  });

  it('affiche les sièges vendus, en sélection, libres, la recette et le remplissage', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByLabelText('Vendus : 2')).toBeTruthy();
    expect(screen.getByLabelText('En sélection : 1')).toBeTruthy();
    expect(screen.getByLabelText('Libres : 1')).toBeTruthy();
    expect(screen.getByLabelText(/^Recette : 50,00/)).toBeTruthy();
    expect(screen.getByText('2 / 4 sièges vendus (50 %)')).toBeTruthy();
  });

  it("colore chaque siège du plan selon son état et affiche la lettre des rangées", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByLabelText('Rangée A, siège 1 : vendu')).toBeTruthy();
    expect(screen.getByLabelText('Rangée A, siège 2 : en_selection')).toBeTruthy();
    expect(screen.getByLabelText('Rangée B, siège 1 : libre')).toBeTruthy();
    expect(screen.getAllByText('B')).toHaveLength(2);
  });

  it('rejoint la room des ventes en direct une fois connecté (#35)', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText(/^En direct/) !== null);

    const socket = io.mock.results[0].value;
    expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'jeton-orga' } }));
    expect(socket.emit).toHaveBeenCalledWith('ventes:rejoindre', 1, expect.any(Function));
  });

  it('met à jour les chiffres dès que le socket pousse une mise à jour, sans recharger la page', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    const socket = io.mock.results[0].value;
    await act(async () => {
      socket.declencher('ventes:maj', ventes({ vendus: 3, libres: 0, recette: 75 }));
    });

    await attendreQue(() => screen.queryByText('3 / 4 sièges vendus (75 %)') !== null);
    expect(global.fetch).toHaveBeenCalledTimes(1); // la mise à jour vient du socket, pas d'un second fetch
  });

  it('se déconnecte du socket en quittant la page', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    const { unmount } = await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);
    const socket = io.mock.results[0].value;
    await act(async () => unmount());

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("affiche l'erreur de l'API (ex. événement d'un autre organisateur)", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(reponse({ success: false, error: "Cet événement n'appartient pas à cet organisateur." }, false));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText("Cet événement n'appartient pas à cet organisateur.") !== null);
  });

  it('signale la perte de connexion si le socket se coupe', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText(/^En direct/) !== null);

    const socket = io.mock.results[0].value;
    await act(async () => {
      socket.declencher('disconnect');
    });

    await attendreQue(() => screen.queryByText('Connexion en direct en cours…') !== null);
    expect(screen.getByText('2 / 4 sièges vendus (50 %)')).toBeTruthy();
  });

  it("n'appelle pas l'API tant que le jeton n'est pas disponible", async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    global.fetch = jest.fn();

    await render(<VentesEvenementScreen />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('VentesEvenementScreen : annuler une réservation (#14)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
    io.mockReset().mockReturnValue(socketFactice());
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  async function ouvrirTableauDeBord(fetch) {
    global.fetch = fetch;
    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);
  }

  it('affiche le spectateur du siège touché et ne propose rien pour un siège libre', async () => {
    await ouvrirTableauDeBord(jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() })));

    expect(screen.getByTestId('siege-103').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('siege-101'));

    expect(screen.getByText('Rangée A, siège 1 · Vendu')).toBeTruthy();
    expect(screen.getByText('Réservé par Ana Roy (ana@test.ca)')).toBeTruthy();
    expect(screen.getByText('Annuler cette réservation')).toBeTruthy();
  });

  it("demande une confirmation, envoie le motif puis recharge les chiffres", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: ventes() }))
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 55, statut: 'annulee' } }))
      .mockResolvedValueOnce(reponse({ success: true, data: ventes({ vendus: 1, libres: 2, recette: 25 }) }));
    await ouvrirTableauDeBord(fetch);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.changeText(screen.getByPlaceholderText("Motif de l'annulation (facultatif)"), '  Erreur de siège  ');
    await fireEvent.press(screen.getByText('Annuler cette réservation'));
    expect(fetch).toHaveBeenCalledTimes(1); // rien n'est envoyé avant la confirmation
    await fireEvent.press(screen.getByText("Confirmer l'annulation"));

    await attendreQue(() => screen.queryByText(/Réservation annulée : rangée A, siège 1/) !== null);
    const [url, options] = fetch.mock.calls[1];
    expect(url).toMatch(/\/reservations\/55\/annulation$/);
    expect(options).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer jeton-orga' } });
    expect(JSON.parse(options.body)).toEqual({ motif: 'Erreur de siège' });
    await attendreQue(() => screen.queryByText('1 / 4 sièges vendus (25 %)') !== null);
  });

  it("« Garder la réservation » n'annule rien", async () => {
    const fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));
    await ouvrirTableauDeBord(fetch);

    await fireEvent.press(screen.getByTestId('siege-102'));
    await fireEvent.press(screen.getByText('Annuler cette réservation'));
    await fireEvent.press(screen.getByText('Garder la réservation'));

    expect(screen.getByText('Annuler cette réservation')).toBeTruthy();
    expect(fetch.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false);
  });

  it("affiche l'erreur de l'API si l'annulation est refusée", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: ventes() }))
      .mockResolvedValueOnce(reponse({ success: false, error: 'Cette réservation est déjà annulée.' }, false));
    await ouvrirTableauDeBord(fetch);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Annuler cette réservation'));
    await fireEvent.press(screen.getByText("Confirmer l'annulation"));

    await attendreQue(() => screen.queryByText('Cette réservation est déjà annulée.') !== null);
  });
});
