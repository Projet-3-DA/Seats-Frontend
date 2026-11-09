// Filtres de la liste des événements (#21). Le modèle Salle n'a pas d'adresse : le « lieu » est la
// salle. Tout se fait côté client, comme la recherche par titre : l'API renvoie déjà la liste complète
// des événements à venir.

// "JJ/MM/AAAA" → Date à minuit (heure locale), ou null si la saisie n'est pas une date valide.
export function parseDate(texte) {
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texte.trim());
  if (!d) return null;
  const [jour, mois, annee] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const date = new Date(annee, mois - 1, jour);
  // new Date() "déborde" (31/02 devient 03/03) : on vérifie que la date n'a pas bougé.
  const inchangee = date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour;
  return inchangee ? date : null;
}

// Salles distinctes des événements chargés, triées par nom, pour proposer le filtre par lieu.
export function sallesDisponibles(evenements) {
  const parId = new Map();
  for (const e of evenements) {
    if (e.salle?.nom && !parId.has(e.salleId)) parId.set(e.salleId, { id: e.salleId, nom: e.salle.nom });
  }
  return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

// Les critères se combinent ; un critère absent (vide ou null) ne filtre pas.
// `au` est inclusif : un événement le jour même, à n'importe quelle heure, est gardé.
export function filtrerEvenements(evenements, { recherche = '', salleId = null, du = null, au = null } = {}) {
  const q = recherche.trim().toLowerCase();
  const finAu = au && new Date(au.getFullYear(), au.getMonth(), au.getDate() + 1);
  return evenements.filter((e) => {
    if (q && !e.titre.toLowerCase().includes(q)) return false;
    if (salleId !== null && e.salleId !== salleId) return false;
    const date = new Date(e.dateHeure);
    if (du && date < du) return false;
    if (finAu && date >= finAu) return false;
    return true;
  });
}
