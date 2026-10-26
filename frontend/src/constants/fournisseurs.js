import { API_URL } from '@/constants/api';

// Fournisseurs de connexion externe affichés sur la page de connexion. Le backend indique lesquels sont
// configurés (GET /auth/fournisseurs) ; les autres restent visibles mais désactivés (« Bientôt »).
// GitHub : OAuth 2 (#101). Google, Microsoft : OpenID Connect (#114).
export const FOURNISSEURS = [
  { id: 'github', nom: 'GitHub', icone: 'logo-github' },
  { id: 'google', nom: 'Google', icone: 'logo-google' },
  { id: 'microsoft', nom: 'Microsoft', icone: 'logo-microsoft' },
];

// Le backend redirige vers le fournisseur, puis revient sur /connexion-externe avec le token.
export function urlConnexion(fournisseur) {
  return `${API_URL}/auth/${fournisseur}`;
}
