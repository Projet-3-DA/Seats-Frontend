// L'adresse de l'API est lue au chargement du module : chaque test recharge les modules après avoir
// fixé EXPO_PUBLIC_API_URL.
function chargerAuth(valeur) {
  if (valeur === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = valeur;
  let auth;
  jest.isolateModules(() => {
    auth = require('./auth');
  });
  return auth;
}

describe('services/auth : adresse de l’API', () => {
  const envOriginal = process.env.EXPO_PUBLIC_API_URL;
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { token: 'jeton' } }),
    });
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    if (envOriginal === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = envOriginal;
  });

  it.each([
    ['vide (image Docker sans adresse fournie)', ''],
    ['absente', undefined],
  ])('variable %s : l’inscription appelle l’API, pas le serveur du frontend', async (_, valeur) => {
    const { registerUser } = chargerAuth(valeur);

    await registerUser({ email: 'a@b.com', password: 'secret', nom: 'Test', prenom: 'Spec', role: 'spectateur' });

    expect(global.fetch.mock.calls[0][0]).toBe('http://localhost:3000/api/auth/register');
  });

  it('utilise l’adresse fournie (site en ligne)', async () => {
    const { registerUser, loginUser } = chargerAuth('https://api.exemple.com/api');

    await registerUser({ email: 'a@b.com', password: 'secret', nom: 'Test', prenom: 'Spec', role: 'spectateur' });
    await loginUser({ email: 'a@b.com', password: 'secret' });

    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.exemple.com/api/auth/register',
      'https://api.exemple.com/api/auth/login',
    ]);
  });
});
