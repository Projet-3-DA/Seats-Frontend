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
          { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00', salleId: 1, salle: { nom: 'Théâtre A' } },
          { id: 2, titre: 'Concert Rock', dateHeure: '2026-11-01T21:00:00', salleId: 2, salle: { nom: 'Salle B' } },
        ],
      }),
    );

    await render(<EventsListScreen />);
    await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);

    expect(screen.getByText('Concert Rock')).toBeTruthy();
    // Une fois sur la carte, une fois sur la puce du filtre par salle (#21).
    expect(screen.getAllByText('Théâtre A')).toHaveLength(2);
  });

  it("affiche l'affiche de chaque événement, sans le tarif (il apparaît sur le plan de salle)", async () => {
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

    expect(screen.queryByText('25,00 $')).toBeNull();
    expect(screen.queryByText('Gratuit')).toBeNull();
    expect(screen.getAllByTestId('affiche-image')).toHaveLength(1);
    expect(screen.getAllByTestId('affiche-icone-defaut')).toHaveLength(1);
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

  describe('filtres par date et par lieu (#21)', () => {
    const evenements = [
      { id: 1, titre: 'Festival de Jazz', dateHeure: '2026-10-28T20:00:00', salleId: 1, salle: { nom: 'Théâtre A' } },
      { id: 2, titre: 'Concert Rock', dateHeure: '2026-11-01T21:00:00', salleId: 2, salle: { nom: 'Salle B' } },
      { id: 3, titre: 'Opéra', dateHeure: '2026-11-15T19:30:00', salleId: 1, salle: { nom: 'Théâtre A' } },
    ];

    beforeEach(async () => {
      global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: evenements }));
      await render(<EventsListScreen />);
      await attendreQue(() => screen.queryByText('Festival de Jazz') !== null);
    });

    // Le nom de la salle apparaît aussi sur les cartes : la puce est le bouton qui porte ce nom.
    function puce(nom) {
      return screen.getByRole('button', { name: nom });
    }

    it('filtre par salle, et revient à toutes les salles', async () => {
      await fireEvent.press(puce('Salle B'));
      expect(screen.getByText('Concert Rock')).toBeTruthy();
      expect(screen.queryByText('Festival de Jazz')).toBeNull();
      expect(screen.queryByText('Opéra')).toBeNull();

      await fireEvent.press(puce('Toutes les salles'));
      expect(screen.getByText('Festival de Jazz')).toBeTruthy();
    });

    it('filtre par plage de dates, la date de fin incluse', async () => {
      await fireEvent.changeText(screen.getByLabelText('Du'), '29/10/2026');
      await fireEvent.changeText(screen.getByLabelText('Au'), '01/11/2026');

      expect(screen.getByText('Concert Rock')).toBeTruthy();
      expect(screen.queryByText('Festival de Jazz')).toBeNull();
      expect(screen.queryByText('Opéra')).toBeNull();
    });

    it('combine la salle et les dates', async () => {
      await fireEvent.press(puce('Théâtre A'));
      await fireEvent.changeText(screen.getByLabelText('Du'), '01/11/2026');

      expect(screen.getByText('Opéra')).toBeTruthy();
      expect(screen.queryByText('Festival de Jazz')).toBeNull();
      expect(screen.queryByText('Concert Rock')).toBeNull();
    });

    it("ne filtre pas sur une date invalide et le signale", async () => {
      await fireEvent.changeText(screen.getByLabelText('Du'), '31/02/2026');

      expect(screen.getByText('Saisissez une date valide au format JJ/MM/AAAA.')).toBeTruthy();
      expect(screen.getByText('Festival de Jazz')).toBeTruthy();
      expect(screen.getByText('Opéra')).toBeTruthy();
    });

    it('affiche un message clair sans résultat, et permet de réinitialiser les filtres', async () => {
      await fireEvent.press(puce('Salle B'));
      await fireEvent.changeText(screen.getByLabelText('Du'), '10/11/2026');

      expect(screen.getByText('Aucun événement ne correspond à vos filtres.')).toBeTruthy();
      expect(screen.queryByText('Aucun événement à venir pour le moment.')).toBeNull();

      await fireEvent.press(screen.getByText('Réinitialiser les filtres'));
      expect(screen.getByText('Festival de Jazz')).toBeTruthy();
      expect(screen.getByText('Concert Rock')).toBeTruthy();
      expect(screen.getByText('Opéra')).toBeTruthy();
    });
  });
});
