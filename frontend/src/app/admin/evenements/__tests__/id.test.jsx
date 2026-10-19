jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import DetailEvenementAdminScreen from '../[id]';

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

function detail(overrides = {}) {
  return {
    evenement: {
      id: 1,
      titre: 'Concert de jazz',
      dateHeure: '2099-11-05T19:00:00Z',
      tarif: 25,
      description: 'Une soirée au sous-sol.',
      afficheUrl: null,
      createdAt: '2026-09-01T12:00:00Z',
      terminee: false,
    },
    salle: { id: 19, nom: 'Grande salle' },
    organisateur: { id: 42, prenom: 'Ana', nom: 'Roy', email: 'ana@test.ca' },
    totaux: { total: 3, vendus: 1, enSelection: 1, libres: 1 },
    recette: 25,
    sieges: [
      {
        id: 101,
        rangee: 1,
        colonne: 1,
        etat: 'vendu',
        reservation: { id: 55, spectateur: { prenom: 'Zoé', nom: 'Tremblay', email: 'zoe@test.ca' } },
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
    ...overrides,
  };
}

describe('DetailEvenementAdminScreen (#36)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-admin', user: { id: 1, role: 'administrateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.restoreAllMocks();
  });

  it("charge le détail avec le jeton de l'administrateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: detail() }));

    await render(<DetailEvenementAdminScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/evenements/1'), {
      headers: { Authorization: 'Bearer jeton-admin' },
    });
  });

  it("affiche les informations de l'événement et son organisateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: detail() }));

    await render(<DetailEvenementAdminScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByText('À venir')).toBeTruthy();
    expect(screen.getByText('Grande salle')).toBeTruthy();
    expect(screen.getByText('Organisé par Ana Roy (ana@test.ca)')).toBeTruthy();
    expect(screen.getByText('Une soirée au sous-sol.')).toBeTruthy();
  });

  it('affiche les ventes, le plan de salle et la liste des réservations', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: detail() }));

    await render(<DetailEvenementAdminScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByLabelText('Vendus : 1')).toBeTruthy();
    expect(screen.getByLabelText('En sélection : 1')).toBeTruthy();
    expect(screen.getByLabelText('Libres : 1')).toBeTruthy();
    expect(screen.getByLabelText('Rangée A, siège 1 : vendu')).toBeTruthy();
    expect(screen.getByLabelText('Rangée B, siège 1 : libre')).toBeTruthy();
    expect(screen.getByText('Réservations (2)')).toBeTruthy();
    expect(screen.getByText('Zoé Tremblay (zoe@test.ca)')).toBeTruthy();
    expect(screen.getByText('Léo Gagnon (leo@test.ca)')).toBeTruthy();
  });

  it('indique un événement terminé et sans réservation', async () => {
    const sansReservation = detail({
      totaux: { total: 1, vendus: 0, enSelection: 0, libres: 1 },
      recette: 0,
      sieges: [{ id: 103, rangee: 1, colonne: 1, etat: 'libre' }],
    });
    sansReservation.evenement.terminee = true;
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: sansReservation }));

    await render(<DetailEvenementAdminScreen />);
    await attendreQue(() => screen.queryByText('Concert de jazz') !== null);

    expect(screen.getByText('Terminé')).toBeTruthy();
    expect(screen.getByText('Aucune réservation pour cet événement.')).toBeTruthy();
  });

  it("affiche l'erreur si l'événement n'existe pas", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: false, error: 'Événement introuvable.' }, false));

    await render(<DetailEvenementAdminScreen />);
    await attendreQue(() => screen.queryByText('Événement introuvable.') !== null);
  });
});
