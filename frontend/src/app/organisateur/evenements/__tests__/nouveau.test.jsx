const mockReplace = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));
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

    await attendreQue(() => mockReplace.mock.calls.length > 0);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/organisateur');

    const [, options] = global.fetch.mock.calls.find(([, o]) => o?.method === 'POST');
    // L'organisateur est déduit du token par le backend : il n'est plus envoyé dans le corps.
    expect(options.headers).toMatchObject({ Authorization: 'Bearer jeton-orga' });
    const corps = JSON.parse(options.body);
    expect(corps).toMatchObject({ salleId: 3, titre: 'Mon spectacle', tarif: 25 });
    expect(corps).not.toHaveProperty('organisateurId');
  });
});

describe('NouvelEvenementScreen : nouvelle séance d’un événement existant (#23)', () => {
  const fetchOriginal = global.fetch;
  // 20 h 30, heure locale de la machine qui lance les tests.
  const dateSource = new Date(2026, 9, 15, 20, 30);
  const ventesSource = {
    evenement: {
      id: 9,
      titre: 'Festival de jazz',
      description: 'Une soirée de jazz',
      afficheUrl: 'https://exemple.com/jazz.jpg',
      dateHeure: dateSource.toISOString(),
      tarif: 18.5,
    },
    salle: { id: 3, nom: 'Grande salle' },
  };

  function api({ source = reponse({ success: true, data: ventesSource }) } = {}) {
    return jest.fn(async (url, options) => {
      if (options?.method === 'POST') return reponse({ success: true, data: { id: 10 } });
      if (url.includes('/ventes')) return source;
      return reponse({ success: true, data: salles });
    });
  }

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
    mockParams = { depuis: '9' };
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
    mockParams = {};
    jest.clearAllMocks();
  });

  it('reprend le titre, la description, l’affiche, la salle, le tarif et l’heure ; la date reste à choisir', async () => {
    global.fetch = api();

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByDisplayValue('Festival de jazz') !== null);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/evenements/9/ventes'), {
      headers: { Authorization: 'Bearer jeton-orga' },
    });
    expect(screen.getByText('Nouvelle séance')).toBeTruthy();
    expect(screen.getByDisplayValue('Une soirée de jazz')).toBeTruthy();
    expect(screen.getByDisplayValue('https://exemple.com/jazz.jpg')).toBeTruthy();
    expect(screen.getByDisplayValue('18,50')).toBeTruthy();
    expect(screen.getByDisplayValue('20:30')).toBeTruthy();
    expect(screen.getByPlaceholderText('28/10/2026').props.value).toBe('');
    await attendreQue(() => screen.queryByText('Grande salle (50 pl.)') !== null);
  });

  it('publie un nouvel événement avec la date choisie, sans toucher à l’original', async () => {
    global.fetch = api();

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByText('Grande salle (50 pl.)') !== null);

    // Sans date, la publication est refusée.
    await fireEvent.press(screen.getByText("Publier l'événement"));
    expect(screen.getByText("La date et l'heure sont requises.")).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('28/10/2026'), '22/10/2099');
    await fireEvent.press(screen.getByText("Publier l'événement"));
    await attendreQue(() => mockReplace.mock.calls.length > 0);

    const appelsPost = global.fetch.mock.calls.filter(([, o]) => o?.method === 'POST');
    expect(appelsPost).toHaveLength(1);
    const [url, options] = appelsPost[0];
    // Création d'un événement : l'original n'est pas modifié.
    expect(url).toMatch(/\/evenements$/);
    const corps = JSON.parse(options.body);
    expect(corps).toEqual({
      salleId: 3,
      titre: 'Festival de jazz',
      description: 'Une soirée de jazz',
      dateHeure: new Date(2099, 9, 22, 20, 30).toISOString(),
      tarif: 18.5,
      afficheUrl: 'https://exemple.com/jazz.jpg',
    });
  });

  it('un tarif gratuit est repris à 0, et un événement sans affiche garde le champ vide', async () => {
    global.fetch = api({
      source: reponse({
        success: true,
        data: { ...ventesSource, evenement: { ...ventesSource.evenement, tarif: 0, afficheUrl: null } },
      }),
    });

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByDisplayValue('Festival de jazz') !== null);

    expect(screen.getByDisplayValue('0,00')).toBeTruthy();
    expect(screen.getByPlaceholderText('…ou collez un lien https://').props.value).toBe('');
  });

  it("affiche l'erreur si l'événement à dupliquer ne peut pas être repris, et le formulaire reste utilisable", async () => {
    global.fetch = api({
      source: reponse({ success: false, error: "Cet événement n'appartient pas à cet organisateur." }, false),
    });

    await render(<NouvelEvenementScreen />);
    await attendreQue(
      () =>
        screen.queryByText(
          "Impossible de reprendre l'événement à dupliquer : Cet événement n'appartient pas à cet organisateur.",
        ) !== null,
    );
    expect(screen.getByText('Choisir une salle…')).toBeTruthy();
  });

  it('sans `depuis`, le formulaire reste vide et ne charge aucun événement', async () => {
    mockParams = {};
    global.fetch = api();

    await render(<NouvelEvenementScreen />);
    await attendreQue(() => screen.queryByText('Choisir une salle…') !== null);

    expect(screen.getByText('Créer un événement')).toBeTruthy();
    expect(global.fetch.mock.calls.some(([url]) => url.includes('/ventes'))).toBe(false);
  });
});
