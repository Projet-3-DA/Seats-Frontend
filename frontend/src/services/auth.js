// Même adresse que le reste de l'application. L'image Docker définit EXPO_PUBLIC_API_URL vide quand
// aucune adresse n'est fournie : avec `??`, la chaîne vide était gardée et l'inscription appelait
// `/auth/register` sur le serveur du frontend, qui répondait « Not found ».
import { API_URL } from '@/constants/api';

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
