jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: '7' }),
}));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import DetailOrganisateurAdminScreen from '../[id]';

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

function organisateur(overrides = {}) {
  return {
    id: 7,
    prenom: 'Ana',
    nom: 'Roy',
    email: 'ana@test.ca',
    createdAt: '2026-09-01T12:00:00Z',
    nombreEvenements: 2,
    nombreSalles: 1,
    salles: [{ id: 3, nom: 'Grande salle', nombreRangees: 5, siegesParRangee: 8 }],
    evenements: [
      { id: 1, titre: 'Festival à venir', dateHeure: '2099-10-28T20:00:00', salle: { id: 3, nom: 'Grande salle' }, terminee: false },
      { id: 2, titre: 'Concert passé', dateHeure: '2020-01-01T20:00:00', salle: { id: 3, nom: 'Grande salle' }, terminee: true },
    ],
    ...overrides,
  };
}

describe('DetailOrganisateurAdminScreen (#19 du backlog)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-admin', user: { id: 1, role: 'administrateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it("charge l'organisateur demandé avec le jeton de l'administrateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: organisateur() }));

    await render(<DetailOrganisateurAdminScreen />);
    await attendreQue(() => screen.queryByText('Ana Roy') !== null);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/organisateurs/7'), {
      headers: { Authorization: 'Bearer jeton-admin' },
    });
  });

  it('affiche son courriel, ses chiffres, ses événements et ses salles', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: organisateur() }));

    await render(<DetailOrganisateurAdminScreen />);
    await attendreQue(() => screen.queryByText('Ana Roy') !== null);

    expect(screen.getByText('ana@test.ca')).toBeTruthy();
    expect(screen.getByLabelText('Événements : 2')).toBeTruthy();
    expect(screen.getByLabelText('Salles : 1')).toBeTruthy();
    expect(screen.getByLabelText('Voir le détail de Festival à venir')).toBeTruthy();
    expect(screen.getByLabelText('Voir le détail de Concert passé')).toBeTruthy();
    expect(screen.getAllByText('Terminé')).toHaveLength(1);
    expect(screen.getByText('5 rangées × 8 sièges · 40 places')).toBeTruthy();
  });

  it("indique quand l'organisateur n'a encore rien créé", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({ success: true, data: organisateur({ nombreEvenements: 0, nombreSalles: 0, salles: [], evenements: [] }) }),
    );

    await render(<DetailOrganisateurAdminScreen />);
    await attendreQue(() => screen.queryByText('Ana Roy') !== null);

    expect(screen.getByText('Aucun événement créé.')).toBeTruthy();
    expect(screen.getByText('Aucune salle créée.')).toBeTruthy();
  });

  it("affiche l'erreur renvoyée par l'API", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: false, error: 'Organisateur introuvable.' }, false));

    await render(<DetailOrganisateurAdminScreen />);
    await attendreQue(() => screen.queryByText('Organisateur introuvable.') !== null);
  });
});
