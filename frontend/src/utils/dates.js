// CommonJS (pas ESM) : ce module est testé avec node:test (node --test), qui exécute les fichiers
// directement sans passer par Babel/Metro. Toujours importable normalement dans l'app (import { x }
// from '@/utils/dates') : Metro fait l'interopérabilité CJS/ESM sans configuration supplémentaire.

// ponytail: pas de sélecteur de date natif installé, on saisit la date et l'heure en texte
// (JJ/MM/AAAA et HH:MM). À remplacer par un vrai date picker si l'équipe en choisit un.
function parseDateHeure(dateTexte, heureTexte) {
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateTexte.trim());
  const h = /^(\d{1,2})\s*[:hH]\s*(\d{2})$/.exec(heureTexte.trim());
  if (!d || !h) return null;
  const [jour, mois, annee] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [heures, minutes] = [Number(h[1]), Number(h[2])];
  if (heures > 23 || minutes > 59) return null;
  const date = new Date(annee, mois - 1, jour, heures, minutes);
  // new Date() "déborde" (31/02 devient 03/03) : on vérifie que la date n'a pas bougé.
  const inchangee = date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour;
  return inchangee ? date : null;
}

function formatDateHeure(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const heures = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${date} à ${heures}h${minutes}`;
}

module.exports = { parseDateHeure, formatDateHeure };
