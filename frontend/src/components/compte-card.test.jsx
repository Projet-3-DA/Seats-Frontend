import { render, screen, act, fireEvent } from '@testing-library/react-native';

import { CompteCard } from './compte-card';

function reponse(json, ok = true) {
  return { ok, json: async () => json };
}

function compte(overrides = {}) {
  return {
    id: 5,
    prenom: 'Sam',
    nom: 'Spectateur',
    email: 'sam@test.ca',
    role: 'spectateur',
    statut: 'actif',
    raisonSuspension: null,
    suspenduLe: null,
    ...overrides,
  };
}

async function appuyer(texte) {
  await act(async () => fireEvent.press(screen.getByText(texte)));
}

describe('CompteCard (#20)', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('affiche le nom, le courriel, le rôle et le statut actif', async () => {
    await render(<CompteCard compte={compte()} token="jeton-admin" onMaj={jest.fn()} />);

    expect(screen.getByText('Sam Spectateur')).toBeTruthy();
    expect(screen.getByText('sam@test.ca')).toBeTruthy();
    expect(screen.getByText('Spectateur')).toBeTruthy();
    expect(screen.getByText('Actif')).toBeTruthy();
    expect(screen.getByText('Suspendre le compte')).toBeTruthy();
  });

  it('suspend le compte avec la raison saisie', async () => {
    const suspendu = compte({ statut: 'suspendu', raisonSuspension: 'Abus signalé', suspenduLe: '2026-11-05T12:00:00Z' });
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: suspendu }));
    const onMaj = jest.fn();

    await render(<CompteCard compte={compte()} token="jeton-admin" onMaj={onMaj} />);
    await appuyer('Suspendre le compte');
    await act(async () =>
      fireEvent.changeText(screen.getByLabelText('Raison de la suspension de Sam Spectateur'), 'Abus signalé'),
    );
    await appuyer('Confirmer la suspension');

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/comptes/5/statut'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jeton-admin' },
      body: JSON.stringify({ statut: 'suspendu', raison: 'Abus signalé' }),
    });
    expect(onMaj).toHaveBeenCalledWith(suspendu);
  });

  it("annuler referme le formulaire sans rien envoyer", async () => {
    global.fetch = jest.fn();

    await render(<CompteCard compte={compte()} token="jeton-admin" onMaj={jest.fn()} />);
    await appuyer('Suspendre le compte');
    await appuyer('Annuler');

    expect(screen.queryByLabelText('Raison de la suspension de Sam Spectateur')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('affiche la date et la raison d’un compte suspendu, et le réactive', async () => {
    const actif = compte();
    global.fetch = jest.fn().mockResolvedValue(reponse({ success: true, data: actif }));
    const onMaj = jest.fn();

    await render(
      <CompteCard
        compte={compte({ statut: 'suspendu', raisonSuspension: 'Revente de billets', suspenduLe: '2026-11-05T12:00:00Z' })}
        token="jeton-admin"
        onMaj={onMaj}
      />,
    );

    expect(screen.getByText('Suspendu')).toBeTruthy();
    expect(screen.getByText('Raison : Revente de billets')).toBeTruthy();
    expect(screen.getByText(/^Suspendu le /)).toBeTruthy();

    await appuyer('Réactiver le compte');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/comptes/5/statut'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ statut: 'actif' }) }),
    );
    expect(onMaj).toHaveBeenCalledWith(actif);
  });

  it('indique quand aucune raison n’a été donnée', async () => {
    await render(<CompteCard compte={compte({ statut: 'suspendu' })} token="jeton-admin" onMaj={jest.fn()} />);

    expect(screen.getByText('Aucune raison indiquée.')).toBeTruthy();
  });

  it("affiche l'erreur renvoyée par l'API sans changer le statut", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(reponse({ success: false, error: 'Un compte administrateur ne peut pas être suspendu.' }, false));
    const onMaj = jest.fn();

    await render(<CompteCard compte={compte()} token="jeton-admin" onMaj={onMaj} />);
    await appuyer('Suspendre le compte');
    await appuyer('Confirmer la suspension');

    expect(screen.getByText('Un compte administrateur ne peut pas être suspendu.')).toBeTruthy();
    expect(onMaj).not.toHaveBeenCalled();
  });
});
