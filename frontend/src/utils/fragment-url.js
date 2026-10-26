// Lit les paramètres du fragment (#cle=valeur) de l'URL courante puis l'efface de la barre d'adresse.
// `fenetre` est injectable pour les tests ; hors navigateur (mobile), il n'y a pas de fragment.
export function lireEtEffacerFragment(fenetre = globalThis.window) {
  if (!fenetre?.location?.hash) return new URLSearchParams();
  const params = new URLSearchParams(fenetre.location.hash.slice(1));
  fenetre.history.replaceState(null, '', fenetre.location.pathname);
  return params;
}
