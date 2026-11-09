jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '1' }) }));
jest.mock('@/lib/auth-context', () => ({ useAuth: jest.fn() }));
// Faux socket : le serveur accepte toute sélection, et `socketTest.recevoir` simule un événement diffusé.
jest.mock('socket.io-client', () => {
  const ecouteurs = {};
  const socket = {
    on: (evt, fn) => (ecouteurs[evt] = fn),
    emit: jest.fn((evt, data, ack) => ack?.(globalThis.reponseSelection ?? { ok: true })),
    disconnect: jest.fn(),
  };
  globalThis.socketTest = { socket, recevoir: (evt, data) => ecouteurs[evt]?.(data) };
  return { io: () => socket };
});

import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { useAuth } from '@/lib/auth-context';
import EventSeatMapScreen from '../[id]';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

const plan = {
  evenementId: 1,
  salle: { id: 19, nom: 'Salle A' },
  sieges: [
    { id: 101, rangee: 1, colonne: 1, etat: 'libre' },
    { id: 103, rangee: 1, colonne: 3, etat: 'reserve' },
  ],
};

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
    if (Date.now() - debut > limiteMs) {
      throw new Error(`attendreQue : condition jamais atteinte après ${limiteMs} ms`);
    }
  }
}

describe('EventSeatMapScreen', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('affiche le plan de salle avec les sièges libres et réservés', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByTestId('siege-101')).toBeTruthy();
    expect(screen.getByTestId('siege-103')).toBeTruthy();
  });

  it("n'affiche pas le bouton Réserver pour un utilisateur non spectateur", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'organisateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText('Réserver')).toBeNull();
    expect(
      screen.getByText('Plan en consultation seulement : la réservation est réservée aux spectateurs.'),
    ).toBeTruthy();
    expect(screen.queryByText('Connectez-vous en tant que spectateur pour réserver des sièges.')).toBeNull();
  });

  it('invite un visiteur non connecté à se connecter pour réserver (#87)', async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText('Réserver')).toBeNull();
    expect(screen.getByText('Connectez-vous en tant que spectateur pour réserver des sièges.')).toBeTruthy();
  });

  it('signale un événement terminé et ne permet pas de réserver (#82)', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planPasse = { ...plan, dateHeure: new Date(Date.now() - 86_400_000).toISOString() };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planPasse }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByText("Événement terminé : il n'est plus possible de réserver.")).toBeTruthy();
    expect(screen.queryByText('Réserver')).toBeNull();
    await fireEvent.press(screen.getByTestId('siege-101'));
    expect(screen.queryByText('Réserver (1)')).toBeNull();
  });

  it('ignore un clic sur un siège occupé', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-103'));

    expect(screen.queryByText('Réserver (1)')).toBeNull();
    expect(screen.getByText('Réserver')).toBeTruthy(); // aucune sélection : le bouton reste vide/désactivé
  });

  it('sélectionne des sièges libres et réserve avec succès', async () => {
    useAuth.mockReturnValue({ token: 'jeton-valide', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [{ id: 1, siegeId: 101, statut: 'en_selection' }] }))
      .mockResolvedValueOnce(reponse({ success: true, data: plan }));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Réservation confirmée !') !== null);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reservations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jeton-valide' }),
        body: JSON.stringify({ evenementId: 1, siegeIds: [101] }),
      }),
    );
  });

  it("affiche l'erreur et rafraîchit le plan si un siège vient d'être pris (409)", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    const planApresConflit = {
      ...plan,
      sieges: [{ ...plan.sieges[0], etat: 'reserve' }, plan.sieges[1]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Ce siège vient d\'être pris.' }, false))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresConflit }));

    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Ce siège vient d\'être pris.') !== null);

    // Le siège pris entretemps n'est plus dans la sélection : impossible de rester bloqué dessus.
    expect(screen.queryByText('Réserver (1)')).toBeNull();
    expect(screen.getByText('Réserver')).toBeTruthy();
  });

  it('retire de la sélection uniquement les sièges pris entretemps, garde les autres sélectionnés', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planDeuxLibres = {
      ...plan,
      sieges: [plan.sieges[0], { id: 104, rangee: 1, colonne: 4, etat: 'libre' }, plan.sieges[1]],
    };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxLibres }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByTestId('siege-104'));
    await attendreQue(() => screen.queryByText('Réserver (2)') !== null);

    // Le siège 101 vient d'être pris par quelqu'un d'autre ; le 104 est toujours libre.
    const planApresConflit = {
      ...planDeuxLibres,
      sieges: [{ ...planDeuxLibres.sieges[0], etat: 'reserve' }, planDeuxLibres.sieges[1], planDeuxLibres.sieges[2]],
    };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Ce siège vient d\'être pris.' }, false))
      .mockResolvedValueOnce(reponse({ success: true, data: planApresConflit }));

    await fireEvent.press(screen.getByText('Réserver (2)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);
    expect(screen.getByTestId('siege-101').props.accessibilityState?.disabled).toBe(true);
  });

  it("affiche la lettre de chaque rangée de part et d'autre du plan", async () => {
    useAuth.mockReturnValue({ token: null, user: null });
    const planDeuxRangees = { ...plan, sieges: [...plan.sieges, { id: 201, rangee: 2, colonne: 1, etat: 'libre' }] };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxRangees }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getAllByText('B')).toHaveLength(2);
  });

  it("n'enregistre rien avant « Confirmer » : « Réserver » n'ouvre que le récapitulatif", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Réserver (1)'));

    expect(screen.getByText('Confirmer votre réservation')).toBeTruthy();
    expect(screen.getByText('Rangée A, siège 1')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1); // seulement le chargement du plan, aucun POST
    expect(global.fetch.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });

  it('« Modifier ma sélection » revient à la sélection sans rien envoyer et garde les sièges choisis', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Modifier ma sélection'));

    expect(screen.queryByText('Confirmer votre réservation')).toBeNull();
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("affiche en jaune et bloque un siège en sélection par un autre, puis le rend dès qu'il est libéré (#8, #31, #32)", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    expect(screen.getByText('En sélection par un autre')).toBeTruthy();
    expect(screen.getByText('Ma sélection')).toBeTruthy();

    await act(async () => globalThis.socketTest.recevoir('siege:selectionne', { siegeId: 101 }));
    expect(screen.getByTestId('siege-101')).toHaveStyle({ backgroundColor: '#eab308' });
    await fireEvent.press(screen.getByTestId('siege-101'));
    expect(screen.queryByText('Réserver (1)')).toBeNull();

    await act(async () => globalThis.socketTest.recevoir('siege:libere', { siegeId: 101 }));
    await fireEvent.press(screen.getByTestId('siege-101'));
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    expect(screen.getByTestId('siege-101')).toHaveStyle({ backgroundColor: '#2563eb' });

    // Délai d'une minute écoulé côté serveur : notre propre sélection est annulée.
    await act(async () => globalThis.socketTest.recevoir('siege:libere', { siegeId: 101 }));
    expect(screen.getByText('Réserver')).toBeTruthy();
  });

  it('ferme le récapitulatif quand le délai de sélection expire', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    expect(screen.getByText('Confirmer')).toBeTruthy();

    await act(async () => globalThis.socketTest.recevoir('siege:libere', { siegeId: 101 }));
    expect(screen.queryByText('Confirmer')).toBeNull();
    expect(screen.getByText('Réserver')).toBeTruthy();
    expect(screen.getByTestId('siege-101').props.accessibilityState?.disabled).toBe(false);
  });

  it("affiche le refus du serveur si le siège vient d'être sélectionné par un autre", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));
    globalThis.reponseSelection = { ok: false, error: "Ce siège est en cours de sélection par quelqu'un d'autre." };

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    await fireEvent.press(screen.getByTestId('siege-101'));

    expect(screen.getByText("Ce siège est en cours de sélection par quelqu'un d'autre.")).toBeTruthy();
    expect(screen.queryByText('Réserver (1)')).toBeNull();
    globalThis.reponseSelection = undefined;
  });
});

describe('EventSeatMapScreen : prix par section dans le récapitulatif (#11)', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it('affiche le prix de chaque siège choisi et le total', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planAvecPrix = {
      ...plan,
      sieges: [
        { id: 101, rangee: 1, colonne: 1, etat: 'libre', sectionId: 10, prix: 40 },
        { id: 102, rangee: 1, colonne: 2, etat: 'libre', sectionId: null, prix: 25 },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planAvecPrix }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    await fireEvent.press(screen.getByTestId('siege-101'));
    await fireEvent.press(screen.getByTestId('siege-102'));
    await fireEvent.press(screen.getByText('Réserver (2)'));

    expect(screen.getByText(/^40,00/)).toBeTruthy();
    expect(screen.getByText(/^25,00/)).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText(/^65,00/)).toBeTruthy();
  });
});

describe('EventSeatMapScreen : sections par couleur sur le plan (#34)', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  it('encadre chaque siège de la couleur de sa section et les liste dans la légende', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    const planAvecSections = {
      ...plan,
      sections: [{ id: 10, nom: 'Balcon', prix: 40, couleur: '#9333ea' }],
      sieges: [
        { id: 101, rangee: 1, colonne: 1, etat: 'libre', sectionId: 10, prix: 40 },
        { id: 102, rangee: 1, colonne: 2, etat: 'libre', sectionId: null, prix: 25 },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planAvecSections }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByTestId('siege-101')).toHaveStyle({ borderColor: '#9333ea', backgroundColor: '#22c55e' });
    expect(screen.getByTestId('siege-102')).not.toHaveStyle({ borderWidth: 3 });
    expect(screen.getByText(/^Balcon · 40,00/)).toBeTruthy();
  });

  it("n'affiche aucune légende de section pour une salle au tarif unique", async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: { ...plan, sections: [] } }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.queryByText(/ · /)).toBeNull();
  });
});

describe('EventSeatMapScreen : plan qui dépasse l’écran', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('la grille ne s’étire pas en hauteur : pas de vide entre une petite salle et la légende', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    expect(screen.getByTestId('grille-sieges').props.style).toEqual(expect.objectContaining({ flexGrow: 0 }));
  });

  it('garde le plan affiché pendant le rechargement après « Confirmer », avec le message du résultat', async () => {
    useAuth.mockReturnValue({ token: 'jeton-valide', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    // Le rechargement du plan reste en cours tant qu'on ne le libère pas : on regarde l'écran pendant ce temps.
    let terminerRechargement;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: true, data: [{ id: 1, siegeId: 101, statut: 'confirmee' }] }))
      .mockReturnValueOnce(new Promise((resolve) => (terminerRechargement = resolve)));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    // L'appui reste en cours tant que le rechargement n'est pas libéré : on ne l'attend qu'à la fin, et on
    // laisse passer le temps sans act() pour ne pas chevaucher le sien.
    const appui = fireEvent.press(screen.getByText('Confirmer'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Le plan n'a pas été remplacé par le spinner : la page ne remonte pas en haut.
    expect(screen.getByTestId('siege-101')).toBeTruthy();
    expect(screen.getByText('Salle A')).toBeTruthy();
    expect(screen.getByText('Réservation confirmée !')).toBeTruthy();

    terminerRechargement(reponse({ success: true, data: plan }));
    await appui;
  });

  it("garde aussi le plan affiché avec le message d'erreur quand la réservation échoue", async () => {
    useAuth.mockReturnValue({ token: 'jeton-valide', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));

    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);
    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);

    let terminerRechargement;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(reponse({ success: false, error: 'Un siège vient d’être pris.' }, false))
      .mockReturnValueOnce(new Promise((resolve) => (terminerRechargement = resolve)));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    // L'appui reste en cours tant que le rechargement n'est pas libéré : on ne l'attend qu'à la fin, et on
    // laisse passer le temps sans act() pour ne pas chevaucher le sien.
    const appui = fireEvent.press(screen.getByText('Confirmer'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(global.fetch).toHaveBeenCalledTimes(2);

    expect(screen.getByTestId('siege-101')).toBeTruthy();
    expect(screen.getByText('Un siège vient d’être pris.')).toBeTruthy();

    terminerRechargement(reponse({ success: true, data: plan }));
    await appui;
  });
});

describe('EventSeatMapScreen : resynchroniser après une confirmation qui échoue (#39)', () => {
  const fetchOriginal = global.fetch;
  const planDeuxLibres = {
    ...plan,
    sieges: [plan.sieges[0], { id: 104, rangee: 1, colonne: 4, etat: 'libre' }, plan.sieges[1]],
  };

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  async function choisirEtConfirmer(ids, reponsesApres) {
    for (const siegeId of ids) await fireEvent.press(screen.getByTestId(`siege-${siegeId}`));
    await attendreQue(() => screen.queryByText(`Réserver (${ids.length})`) !== null);
    global.fetch = jest.fn();
    for (const r of reponsesApres) global.fetch.mockResolvedValueOnce(r);
    await fireEvent.press(screen.getByText(`Réserver (${ids.length})`));
    await fireEvent.press(screen.getByText('Confirmer'));
  }

  it('nomme le siège pris, l’encadre sur le plan et dit que les autres restent sélectionnés', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxLibres }));
    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    const planApresConflit = {
      ...planDeuxLibres,
      sieges: [{ ...planDeuxLibres.sieges[0], etat: 'reserve' }, planDeuxLibres.sieges[1], planDeuxLibres.sieges[2]],
    };
    await choisirEtConfirmer(
      [101, 104],
      [reponse({ success: false, error: 'Un ou plusieurs sièges viennent d’être pris.' }, false), reponse({ success: true, data: planApresConflit })],
    );

    await attendreQue(() => screen.queryByTestId('sieges-perdus') !== null);
    const message = screen.getByTestId('sieges-perdus');
    expect(message).toHaveTextContent(/Ce siège a été pris.*rangée A, siège 1/);
    expect(message).toHaveTextContent(/Votre autre siège reste sélectionné/);
    expect(screen.getByLabelText("rangée A, siège 1, pris par quelqu'un d'autre")).toBeTruthy();
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    // Le plan a été rechargé sans action du spectateur, et le serveur temps réel réinterrogé.
    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('/evenements/1/plan'));
    expect(globalThis.socketTest.socket.emit).toHaveBeenCalledWith('plan:rejoindre', 1);
  });

  it('retire aussi un siège que le serveur dit tenu par un autre, absent du plan rechargé', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxLibres }));
    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    // Le plan rechargé montre encore les deux sièges libres : seule la liste temps réel dit que le 104 est tenu.
    await choisirEtConfirmer(
      [101, 104],
      [reponse({ success: false, error: "Un ou plusieurs sièges sont en cours de sélection par quelqu'un d'autre." }, false), reponse({ success: true, data: planDeuxLibres })],
    );
    await attendreQue(() => screen.queryByText('Réserver (2)') !== null);
    await act(async () => globalThis.socketTest.recevoir('plan:selections', { siegeIds: [104] }));

    expect(screen.getByTestId('sieges-perdus')).toHaveTextContent(/rangée A, siège 4/);
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    expect(screen.getByTestId('siege-104').props.accessibilityState?.disabled).toBe(true);
  });

  it('efface le signalement dès que le spectateur choisit un autre siège', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: planDeuxLibres }));
    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    const planApresConflit = {
      ...planDeuxLibres,
      sieges: [{ ...planDeuxLibres.sieges[0], etat: 'reserve' }, planDeuxLibres.sieges[1], planDeuxLibres.sieges[2]],
    };
    await choisirEtConfirmer(
      [101],
      [reponse({ success: false, error: 'Un ou plusieurs sièges viennent d’être pris.' }, false), reponse({ success: true, data: planApresConflit })],
    );
    await attendreQue(() => screen.queryByTestId('sieges-perdus') !== null);
    expect(screen.getByTestId('sieges-perdus')).toHaveTextContent(/Choisissez d’autres sièges libres/);

    await fireEvent.press(screen.getByTestId('siege-104'));
    expect(screen.queryByTestId('sieges-perdus')).toBeNull();
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
  });

  it('serveur injoignable : message clair, plan et sélection gardés au lieu d’une page d’erreur', async () => {
    useAuth.mockReturnValue({ token: 'jeton', user: { id: 5, role: 'spectateur' } });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: plan }));
    await render(<EventSeatMapScreen />);
    await attendreQue(() => screen.queryByText('Salle A') !== null);

    await fireEvent.press(screen.getByTestId('siege-101'));
    await attendreQue(() => screen.queryByText('Réserver (1)') !== null);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await fireEvent.press(screen.getByText('Réserver (1)'));
    await fireEvent.press(screen.getByText('Confirmer'));

    await attendreQue(() => screen.queryByText(/Connexion au serveur impossible/) !== null);
    expect(screen.queryByText(/Erreur :/)).toBeNull();
    expect(screen.getByText('Salle A')).toBeTruthy();
    expect(screen.getByText('Réserver (1)')).toBeTruthy();
    expect(screen.queryByTestId('sieges-perdus')).toBeNull();
  });
});
