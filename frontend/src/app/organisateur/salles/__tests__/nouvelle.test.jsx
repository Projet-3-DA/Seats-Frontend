const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '3' }),
  useRouter: () => ({ back: mockBack }),
}));
jest.mock('@/lib/auth-context', () => ({ useAuth: () => ({ token: 'jeton-orga' }) }));

import { render, screen, fireEvent, act } from '@testing-library/react-native';

import NouvelleSalleScreen from '../nouvelle';

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

describe('NouvelleSalleScreen en modification (#10)', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it('pré-remplit la salle existante puis enregistre avec PUT', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 3, nom: 'Salle B', nombreRangees: 2, siegesParRangee: 4 } }))
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 3 } }));

    await render(<NouvelleSalleScreen />);
    await attendreQue(() => screen.queryByDisplayValue('Salle B') !== null);
    expect(screen.getByText('Modifier la salle')).toBeTruthy();

    await fireEvent.press(screen.getByText('Enregistrer la salle'));
    await attendreQue(() => mockBack.mock.calls.length > 0);

    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/salles/3'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ nom: 'Salle B', nombreRangees: 2, siegesParRangee: 4 }),
      }),
    );
  });

  it('affiche le refus du serveur pour une salle utilisée par un événement', async () => {
    const message = 'Cette salle est déjà utilisée par un événement : elle ne peut plus être modifiée.';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: { id: 3, nom: 'Salle B', nombreRangees: 2, siegesParRangee: 4 } }))
      .mockResolvedValueOnce(reponse({ success: false, error: message }, false));

    await render(<NouvelleSalleScreen />);
    await attendreQue(() => screen.queryByDisplayValue('Salle B') !== null);
    await fireEvent.press(screen.getByText('Enregistrer la salle'));

    await attendreQue(() => screen.queryByText(message) !== null);
  });
});
