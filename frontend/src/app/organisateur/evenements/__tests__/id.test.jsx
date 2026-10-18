jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import VentesEvenementScreen, { INTERVALLE_RAFRAICHISSEMENT_MS } from '../[id]';

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

function ventes({ vendus = 2, enSelection = 1, libres = 1, recette = 50 } = {}) {
  return {
    evenement: { id: 1, titre: 'Concert de jazz', dateHeure: '2099-11-05T19:00:00Z', tarif: 25 },
    salle: { id: 19, nom: 'Grande salle' },
    totaux: { total: vendus + enSelection + libres, vendus, enSelection, libres },
    recette,
    sieges: [
      { id: 101, rangee: 1, colonne: 1, etat: 'vendu' },
      { id: 102, rangee: 1, colonne: 2, etat: 'en_selection' },
      { id: 103, rangee: 2, colonne: 1, etat: 'libre' },
    ],
  };
}

describe('VentesEvenementScreen (#13)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
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

  it('recharge les chiffres automatiquement, sans recharger la page', async () => {
    const setIntervalEspion = jest.spyOn(global, 'setInterval');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: ventes() }))
      .mockResolvedValueOnce(reponse({ success: true, data: ventes({ vendus: 3, libres: 0, recette: 75 }) }));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    const appel = setIntervalEspion.mock.calls.find(([, delai]) => delai === INTERVALLE_RAFRAICHISSEMENT_MS);
    expect(appel).toBeDefined();
    await act(async () => {
      appel[0]();
    });
    await attendreQue(() => screen.queryByText('3 / 4 sièges vendus (75 %)') !== null);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('arrête le rafraîchissement en quittant la page', async () => {
    const clearIntervalEspion = jest.spyOn(global, 'clearInterval');
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: ventes() }));

    const { unmount } = await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);
    await act(async () => unmount());

    expect(clearIntervalEspion).toHaveBeenCalled();
  });

  it("affiche l'erreur de l'API (ex. événement d'un autre organisateur)", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(reponse({ success: false, error: "Cet événement n'appartient pas à cet organisateur." }, false));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText("Cet événement n'appartient pas à cet organisateur.") !== null);
  });

  it("garde les derniers chiffres si un rafraîchissement échoue", async () => {
    const setIntervalEspion = jest.spyOn(global, 'setInterval');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: ventes() }))
      .mockRejectedValueOnce(new Error('Erreur réseau'));

    await render(<VentesEvenementScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    const appel = setIntervalEspion.mock.calls.find(([, delai]) => delai === INTERVALLE_RAFRAICHISSEMENT_MS);
    await act(async () => {
      appel[0]();
    });
    await attendreQue(() => screen.queryByText(/Connexion perdue/) !== null);
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
