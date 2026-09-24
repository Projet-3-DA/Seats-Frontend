export function capaciteSalle(salle) {
  return salle.nombreRangees * salle.siegesParRangee;
}

// Regroupe les sièges du plan de salle par numéro de rangée, chaque rangée triée par colonne.
// Renvoie les numéros de rangée triés numériquement (1, 2, 10… pas 1, 10, 2…).
export function groupSiegesParRangee(sieges) {
  const rangees = {};
  sieges.forEach((s) => {
    (rangees[s.rangee] ??= []).push(s);
  });
  const numerosRangees = Object.keys(rangees).sort((a, b) => a - b);
  numerosRangees.forEach((rangee) => {
    rangees[rangee].sort((a, b) => a.colonne - b.colonne);
  });
  return { rangees, numerosRangees };
}
