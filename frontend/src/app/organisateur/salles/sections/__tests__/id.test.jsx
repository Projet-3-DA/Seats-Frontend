jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useLocalSearchParams: () => ({ id: '3' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, act, fireEvent } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import SectionsSalleScreen from '../[id]';

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

// Salle de 2 rangées × 2 sièges, déjà une section « Parterre » sur le siège 1.
function salle(overrides = {}) {
  return {
    id: 3,
    nom: 'Grande salle',
    _count: { evenements: 0 },
    sections: [{ id: 10, nom: 'Parterre', prix: 45, couleur: '#2563eb' }],
    sieges: [
      { id: 1, numeroRangee: 1, numeroColonne: 1, sectionId: 10 },
      { id: 2, numeroRangee: 1, numeroColonne: 2, sectionId: null },
      { id: 3, numeroRangee: 2, numeroColonne: 1, sectionId: null },
      { id: 4, numeroRangee: 2, numeroColonne: 2, sectionId: null },
    ],
    ...overrides,
  };
}

const etiquette = (rangee, colonne, section) => `Rangée ${rangee}, siège ${colonne} : ${section}`;

describe('SectionsSalleScreen (#11)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'jeton-orga', user: { id: 7, role: 'organisateur' } });
  });
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  async function ouvrir(donnees = salle(), suite = []) {
    const fetch = jest.fn().mockResolvedValueOnce(reponse({ success: true, data: donnees }));
    suite.forEach((r) => fetch.mockResolvedValueOnce(r));
    global.fetch = fetch;
    await render(<SectionsSalleScreen />);
    await attendreQue(() => screen.queryByText('Grande salle') !== null);
    return fetch;
  }

  it('affiche les sections existantes et les sièges qui leur appartiennent', async () => {
    await ouvrir();

    expect(screen.getByLabelText('Nom de la section Parterre').props.value).toBe('Parterre');
    expect(screen.getByLabelText('Prix de la section Parterre').props.value).toBe('45');
    expect(screen.getByLabelText(etiquette('A', 1, 'Parterre'))).toBeTruthy();
    expect(screen.getByLabelText(etiquette('A', 2, 'hors section'))).toBeTruthy();
    expect(screen.getByText(/Hors section · tarif de l'événement \(3 sièges\)/)).toBeTruthy();
  });

  it('assigne un siège à la section active, et le retire au second toucher', async () => {
    await ouvrir();

    await fireEvent.press(screen.getByTestId('siege-2'));
    expect(screen.getByLabelText(etiquette('A', 2, 'Parterre'))).toBeTruthy();

    await fireEvent.press(screen.getByTestId('siege-2'));
    expect(screen.getByLabelText(etiquette('A', 2, 'hors section'))).toBeTruthy();
  });

  it("assigne toute une rangée en touchant sa lettre, chaque siège n'ayant qu'une section", async () => {
    await ouvrir();

    await fireEvent.press(screen.getByText('Ajouter une section'));
    await fireEvent.press(screen.getAllByLabelText('Rangée A entière')[0]);

    // Le siège 1 passe de Parterre à la nouvelle section : il ne peut pas être dans les deux.
    expect(screen.getByLabelText(etiquette('A', 1, 'Section 2'))).toBeTruthy();
    expect(screen.getByLabelText(etiquette('A', 2, 'Section 2'))).toBeTruthy();
    expect(screen.getByLabelText(etiquette('B', 1, 'hors section'))).toBeTruthy();
  });

  it('la gomme retire des sièges de leur section', async () => {
    await ouvrir();

    await fireEvent.press(screen.getByLabelText('Gomme'));
    await fireEvent.press(screen.getByTestId('siege-1'));

    expect(screen.getByLabelText(etiquette('A', 1, 'hors section'))).toBeTruthy();
  });

  it('enregistre les sections avec leurs sièges et le jeton', async () => {
    const enregistree = salle({
      sections: [
        { id: 10, nom: 'Parterre', prix: 45, couleur: '#2563eb' },
        { id: 11, nom: 'Balcon', prix: 25.5, couleur: '#9333ea' },
      ],
    });
    const fetch = await ouvrir(salle(), [reponse({ success: true, data: enregistree })]);

    await fireEvent.press(screen.getByText('Ajouter une section'));
    await fireEvent.changeText(screen.getByLabelText('Nom de la section Section 2'), 'Balcon');
    await fireEvent.changeText(screen.getByLabelText('Prix de la section Balcon'), '25,50');
    await fireEvent.press(screen.getAllByLabelText('Rangée B entière')[0]);
    await fireEvent.press(screen.getByText('Enregistrer les sections'));

    await attendreQue(() => screen.queryByText('Sections enregistrées.') !== null);
    const [url, options] = fetch.mock.calls[1];
    expect(url).toMatch(/\/salles\/3\/sections$/);
    expect(options).toMatchObject({ method: 'PUT', headers: { Authorization: 'Bearer jeton-orga' } });
    expect(JSON.parse(options.body)).toEqual({
      sections: [
        { nom: 'Parterre', prix: 45, couleur: '#2563eb', siegeIds: [1] },
        { nom: 'Balcon', prix: 25.5, couleur: expect.any(String), siegeIds: [3, 4] },
      ],
    });
  });

  it("n'envoie rien et explique l'erreur si une section est vide", async () => {
    const fetch = await ouvrir();

    await fireEvent.press(screen.getByText('Ajouter une section'));
    await fireEvent.changeText(screen.getByLabelText('Prix de la section Section 2'), '10');
    await fireEvent.press(screen.getByText('Enregistrer les sections'));

    expect(screen.getByText('La section « Section 2 » ne contient aucun siège.')).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("affiche l'erreur du serveur", async () => {
    await ouvrir(salle(), [reponse({ success: false, error: 'Salle introuvable' }, false)]);

    await fireEvent.press(screen.getByText('Enregistrer les sections'));

    await attendreQue(() => screen.queryByText('Salle introuvable') !== null);
  });

  it('bloque la modification si un événement utilise déjà la salle', async () => {
    await ouvrir(salle({ _count: { evenements: 1 } }));

    expect(screen.getByText(/déjà utilisée par un événement/)).toBeTruthy();
    expect(screen.queryByText('Enregistrer les sections')).toBeNull();
    expect(screen.queryByText('Ajouter une section')).toBeNull();
    await fireEvent.press(screen.getByTestId('siege-2'));
    expect(screen.getByLabelText(etiquette('A', 2, 'hors section'))).toBeTruthy();
  });
});
