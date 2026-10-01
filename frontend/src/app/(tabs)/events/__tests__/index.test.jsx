// Link n'a besoin, pour cet écran, que d'afficher ses enfants : la navigation elle-même n'est pas
// testée ici (asChild/href sont ignorés par ce mock).
// useFocusEffect s'exécute au montage, comme si l'écran avait le focus ; `simulerRetourSurEcran`
// rejoue le dernier effet pour simuler le retour sur l'onglet.
let mockDernierEffetFocus;
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    Link: ({ children }) => children,
    useFocusEffect: (effet) => {
      mockDernierEffetFocus = effet;
      useEffect(effet, [effet]);
    },
  };
});

jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

async function simulerRetourSurEcran() {
  await act(async () => {
    mockDernierEffetFocus();
  });
}

import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import EventsListScreen from '../index';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

// ponytail: `findByText` de @testing-library/react-native (v14) semble ne jamais se résoudre avec le
// `test-renderer` de ce projet (le test reste bloqué jusqu'au timeout global de Jest). On sonde donc
// nous-mêmes, en vrai temps (dans act(), pour que React traite proprement les mises à jour d'état
// déclenchées par le fetch), jusqu'à ce que la condition attendue soit vraie.
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

describe('EventsListScreen', () => {
  const fetchOriginal = global.fetch;
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: 5, role: 'spectateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  describe('bouton « Réserver mes places » selon le rôle (#87)', () => {
    const evenement = { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00' };

    it.each([
      ['un spectateur', { id: 5, role: 'spectateur' }, true],
      ['un visiteur non connecté', null, true],
      ['un organisateur', { id: 7, role: 'organisateur' }, false],
      ['un administrateur', { id: 9, role: 'administrateur' }, false],
    ])('%s : bouton affiché = %s', async (_, user, attendu) => {
      useAuth.mockReturnValue({ user });
      global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [evenement] }));

      await render(<EventsListScreen />);
      await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);

      expect(screen.queryByText('Réserver mes places') !== null).toBe(attendu);
    });
  });

  it('affiche les événements renvoyés par l\'API', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00', salle: { nom: 'Théâtre A' } },
          { id: 2, titre: 'Concert Rock', dateHeure: '2026-11-01T21:00:00', salle: { nom: 'Salle B' } },
        ],
      }),
    );

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);

    expect(screen.getByText('Concert Rock')).toBeTruthy();
    expect(screen.getByText('Théâtre A')).toBeTruthy();
  });

  it("affiche le tarif et l'affiche de chaque événement, y compris un événement gratuit sans affiche", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          {
            id: 1,
            titre: 'Festival de Jazz',
            dateHeure: '2026-10-28T20:00:00',
            tarif: '25.00',
            afficheUrl: 'https://exemple.com/affiche.jpg',
          },
          { id: 2, titre: 'Portes ouvertes', dateHeure: '2026-11-01T21:00:00', tarif: null, afficheUrl: null },
        ],
      }),
    );

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);

    expect(screen.getByText('25,00 $')).toBeTruthy();
    expect(screen.getByText('Gratuit')).toBeTruthy();
    expect(screen.getAllByTestId('affiche-image')).toHaveLength(1);
    expect(screen.getAllByTestId('affiche-icone-defaut')).toHaveLength(1);
  });

  it("affiche « Gratuit » pour un événement créé avec un tarif de 0 (et non « 0,00 $ »)", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [{ id: 1, titre: 'Portes ouvertes', dateHeure: '2026-11-01T21:00:00', tarif: '0.00', afficheUrl: null }],
      }),
    );

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Portes ouvertes') !== null);

    expect(screen.getByText('Gratuit')).toBeTruthy();
    expect(screen.queryByText('0,00 $')).toBeNull();
  });

  it("recharge la liste au retour sur l'écran, pour afficher un événement créé entre-temps", async () => {
    const jazz = { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00' };
    const nouveau = { id: 2, titre: 'Nouvel événement', dateHeure: '2026-11-05T19:00:00' };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [jazz] }))
      .mockResolvedValueOnce(reponse({ success: true, data: [jazz, nouveau] }));

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);
    expect(screen.queryByText('Nouvel événement')).toBeNull();

    await simulerRetourSurEcran();
    await attendreQue(() => screen.queryByText('Nouvel événement') !== null);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('affiche un message quand la liste est vide', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: [] }));

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Aucun événement à venir pour le moment.') !== null);
  });

  it('affiche le message d\'erreur renvoyé par l\'API', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: false, error: 'Panne serveur' }, false));

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Panne serveur') !== null);
  });

  it('affiche un message générique si la requête réseau échoue', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Failed to fetch') !== null);
  });

  it('filtre la liste selon le texte recherché', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      reponse({
        success: true,
        data: [
          { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00' },
          { id: 2, titre: 'Concert Rock', dateHeure: '2026-11-01T21:00:00' },
        ],
      }),
    );

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);

    await fireEvent.changeText(screen.getByPlaceholderText('Rechercher un spectacle...'), 'jazz');

    expect(screen.getByText('Festival de Jazz')).toBeTruthy();
    expect(screen.queryByText('Concert Rock')).toBeNull();
  });
});
