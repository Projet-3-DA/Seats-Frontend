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

import { render, screen, act, fireEvent } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import SupervisionScreen from '../supervision';

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

const EVENEMENTS = [
  {
    id: 1,
    titre: 'Festival à venir',
    dateHeure: '2099-10-28T20:00:00',
    salle: { id: 3, nom: 'Grande salle' },
    organisateur: { id: 7, prenom: 'Ana', nom: 'Roy', email: 'ana@test.ca' },
    vendus: 12,
    totalSieges: 40,
    terminee: false,
  },
  {
    id: 2,
    titre: 'Concert passé',
    dateHeure: '2020-01-01T20:00:00',
    salle: { id: 4, nom: 'Petite salle' },
    organisateur: { id: 8, prenom: 'Léo', nom: 'Gagnon', email: 'leo@test.ca' },
    vendus: 30,
    totalSieges: 30,
    terminee: true,
  },
];

describe('SupervisionScreen (#36)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-admin', user: { id: 1, role: 'administrateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it("charge tous les événements avec le jeton de l'administrateur", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: EVENEMENTS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/evenements'), {
      headers: { Authorization: 'Bearer jeton-admin' },
    });
  });

  it("affiche les événements de tous les organisateurs, passés compris, avec l'organisateur et les ventes", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: EVENEMENTS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);

    expect(screen.getByText('Concert passé')).toBeTruthy();
    expect(screen.getByText('Ana Roy')).toBeTruthy();
    expect(screen.getByText('Léo Gagnon')).toBeTruthy();
    expect(screen.getByText('12 / 40 sièges vendus')).toBeTruthy();
    expect(screen.getAllByText('Terminé')).toHaveLength(1);
    expect(screen.getByText('2 événement(s) sur la plateforme, tous organisateurs confondus.')).toBeTruthy();
  });

  it('filtre les événements à venir et terminés', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: EVENEMENTS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);

    await act(async () => fireEvent.press(screen.getByText('Terminés')));
    expect(screen.queryByText('Festival à venir')).toBeNull();
    expect(screen.getByText('Concert passé')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByText('À venir')));
    expect(screen.getByText('Festival à venir')).toBeTruthy();
    expect(screen.queryByText('Concert passé')).toBeNull();

    await act(async () => fireEvent.press(screen.getByText('Tous')));
    expect(screen.getByText('Festival à venir')).toBeTruthy();
    expect(screen.getByText('Concert passé')).toBeTruthy();
  });

  it("chaque carte mène au détail de l'événement", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: EVENEMENTS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);

    expect(screen.getByLabelText('Voir le détail de Festival à venir')).toBeTruthy();
    expect(screen.getByLabelText('Voir le détail de Concert passé')).toBeTruthy();
  });

  it("affiche un message quand aucun événement n'existe", async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [] }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText("Aucun événement n'a encore été créé.") !== null);
  });

  it("affiche l'erreur renvoyée par l'API", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({ success: false, error: 'Accès interdit. Permissions insuffisantes.' }, false),
    );

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Accès interdit. Permissions insuffisantes.') !== null);
  });
});

const ORGANISATEURS = [
  { id: 7, prenom: 'Ana', nom: 'Roy', email: 'ana@test.ca', createdAt: '2026-09-01T12:00:00Z', nombreEvenements: 3, nombreSalles: 2 },
  { id: 8, prenom: 'Léo', nom: 'Gagnon', email: 'leo@test.ca', createdAt: '2026-09-02T12:00:00Z', nombreEvenements: 0, nombreSalles: 0 },
];

describe('SupervisionScreen : organisateurs (#15)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-admin', user: { id: 1, role: 'administrateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it("passe à la liste des organisateurs, chargée avec le jeton de l'administrateur", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: EVENEMENTS }))
      .mockResolvedValueOnce(reponse({ success: true, data: ORGANISATEURS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);

    await act(async () => fireEvent.press(screen.getByText('Organisateurs')));
    await attendreQue(() => screen.queryByText('ana@test.ca') !== null);

    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('/admin/organisateurs'), {
      headers: { Authorization: 'Bearer jeton-admin' },
    });
    expect(screen.getByText('Tous les organisateurs')).toBeTruthy();
    expect(screen.getByText('2 organisateur(s) inscrit(s) sur la plateforme.')).toBeTruthy();
  });

  it("affiche le nom, le courriel et le nombre d'événements de chaque organisateur, sans les filtres", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: EVENEMENTS }))
      .mockResolvedValueOnce(reponse({ success: true, data: ORGANISATEURS }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);
    await act(async () => fireEvent.press(screen.getByText('Organisateurs')));
    await attendreQue(() => screen.queryByText('ana@test.ca') !== null);

    expect(screen.getByText('Ana Roy')).toBeTruthy();
    expect(screen.getByText('3 événement(s) · 2 salle(s)')).toBeTruthy();
    expect(screen.getByText('leo@test.ca')).toBeTruthy();
    expect(screen.getByText('0 événement(s) · 0 salle(s)')).toBeTruthy();
    expect(screen.getByLabelText('Voir le détail de Ana Roy')).toBeTruthy();
    expect(screen.queryByText('Terminés')).toBeNull();
  });

  it("affiche un message quand aucun organisateur n'est inscrit", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: EVENEMENTS }))
      .mockResolvedValueOnce(reponse({ success: true, data: [] }));

    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);
    await act(async () => fireEvent.press(screen.getByText('Organisateurs')));
    await attendreQue(() => screen.queryByText("Aucun organisateur n'est encore inscrit.") !== null);
  });
});

const COMPTES = [
  { id: 5, prenom: 'Sam', nom: 'Spectateur', email: 'sam@test.ca', role: 'spectateur', statut: 'actif' },
  {
    id: 7,
    prenom: 'Ana',
    nom: 'Roy',
    email: 'ana@test.ca',
    role: 'organisateur',
    statut: 'suspendu',
    raisonSuspension: 'Abus signalé',
    suspenduLe: '2026-11-05T12:00:00Z',
  },
];

describe('SupervisionScreen : comptes (#20)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-admin', user: { id: 1, role: 'administrateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  async function ouvrirComptes(fetchMock) {
    global.fetch = fetchMock;
    await render(<SupervisionScreen />);
    await attendreQue(() => screen.queryByText('Festival à venir') !== null);
    await act(async () => fireEvent.press(screen.getByText('Comptes')));
    await attendreQue(() => screen.queryByText('sam@test.ca') !== null);
  }

  it('liste les comptes avec leur statut, chargés avec le jeton de l’administrateur', async () => {
    await ouvrirComptes(
      jest
        .fn()
        .mockResolvedValueOnce(reponse({ success: true, data: EVENEMENTS }))
        .mockResolvedValueOnce(reponse({ success: true, data: COMPTES })),
    );

    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('/admin/comptes'), {
      headers: { Authorization: 'Bearer jeton-admin' },
    });
    expect(screen.getByText('Actif')).toBeTruthy();
    expect(screen.getByText('Suspendu')).toBeTruthy();
    expect(screen.getByText('Raison : Abus signalé')).toBeTruthy();
    expect(screen.queryByText('Terminés')).toBeNull();
  });

  it('met à jour la carte après une suspension', async () => {
    await ouvrirComptes(
      jest
        .fn()
        .mockResolvedValueOnce(reponse({ success: true, data: EVENEMENTS }))
        .mockResolvedValueOnce(reponse({ success: true, data: COMPTES }))
        .mockResolvedValueOnce(
          reponse({ success: true, data: { ...COMPTES[0], statut: 'suspendu', raisonSuspension: null, suspenduLe: null } }),
        ),
    );

    await act(async () => fireEvent.press(screen.getByText('Suspendre le compte')));
    await act(async () => fireEvent.press(screen.getByText('Confirmer la suspension')));
    await attendreQue(() => screen.queryAllByText('Suspendu').length === 2);

    expect(screen.getAllByText('Réactiver le compte')).toHaveLength(2);
  });
});
