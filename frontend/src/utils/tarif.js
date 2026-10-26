// "Gratuit" pour un tarif à 0 (le backend demande 0 pour un événement gratuit) et pour un tarif absent
// (null : ancien événement créé avant l'ajout du tarif). Sinon, un Decimal Prisma sérialisé en string.
// Accepte "25", "25,5" ou "25.50" : 6 chiffres avant la virgule et 2 après au plus (Decimal(8,2) en base).
export function parseTarif(texte) {
  const t = texte.trim().replace(',', '.');
  return /^\d{1,6}(\.\d{1,2})?$/.test(t) ? Number(t) : null;
}

// Montant en dollars canadiens, y compris 0 (« 0,00 $ ») : pour un prix ou un total, pas un tarif d'affiche.
export function formatMontant(montant) {
  return Number(montant).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

export function formatTarif(tarif) {
  if (tarif === null || tarif === undefined || Number(tarif) === 0) return 'Gratuit';
  return Number(tarif).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}
