const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function post(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? 'Une erreur est survenue, veuillez réessayer.');
  }

  return json.data;
}

export function registerUser({ email, password, nom, prenom, role }) {
  return post('/auth/register', { email, motDePasse: password, nom, prenom, role });
}

export function loginUser({ email, password }) {
  return post('/auth/login', { email, password });
}
