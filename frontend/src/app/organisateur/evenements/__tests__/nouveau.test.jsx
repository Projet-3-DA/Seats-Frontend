const mockBack = jest.fn();
jest.mock('expo-router', () => ({ Link: ({ children }) => children, useRouter: () => ({ back: mockBack }) }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import NouvelEvenementScreen from '../nouveau';

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

const salles = [{ id: 3, organisateurId: 7, nom: 'Grande salle', nombreRangees: 5, siegesParRangee: 10 }];

describe('NouvelEvenementScreen', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it("charge les salles avec le jeton de l'utilisateur (l'API exige l'authentification)", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: salles }));

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByText('Choisir une salle…') !== null);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/salles'),
      expect.objectContaining({ headers: { Authorization: 'Bearer jeton-orga' } }),
    );
  });

  it("n'appelle pas l'API tant que le jeton n'est pas disponible", async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    global.fetch = jest.fn();

    await render(<NouvelEvenementScreen />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("affiche un message quand l'utilisateur n'a encore aucune salle", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [] }));

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByText("Vous n'avez encore créé aucune salle.") !== null);
  });

  it("publie l'événement au nom de l'utilisateur connecté, pas d'un organisateur codé en dur", async () => {
    global.fetch = jest.fn(async (url, options) =>
      options?.method === 'POST' ? reponse({ success: true, data: { id: 1 } }) : reponse({ success: true, data: salles }),
    );

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByText('Choisir une salle…') !== null);

    await fireEvent.changeText(screen.getByPlaceholderText("Festival de Jazz — Session d'improvisation"), 'Mon spectacle');
    await fireEvent.changeText(screen.getByPlaceholderText('28/10/2026'), '28/10/2099');
    await fireEvent.changeText(screen.getByPlaceholderText('20:00'), '20:00');
    await fireEvent.changeText(screen.getByPlaceholderText('25,00'), '25');
    await fireEvent.press(screen.getByText('Choisir une salle…'));
    await fireEvent.press(screen.getByText('Grande salle (50 pl.)'));
    await fireEvent.press(screen.getByText("Publier l'événement"));

    await attendreQue(() => mockBack.mock.calls.length > 0);

    const [, options] = global.fetch.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(JSON.parse(options.body)).toMatchObject({ organisateurId: 7, salleId: 3, titre: 'Mon spectacle', tarif: 25 });
  });
});
