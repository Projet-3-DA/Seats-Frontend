// "Gratuit" pour un tarif à 0 (le backend demande 0 pour un événement gratuit) et pour un tarif absent
// (null : ancien événement créé avant l'ajout du tarif). Sinon, un Decimal Prisma sérialisé en string.
export function formatTarif(tarif) {
  if (tarif === null || tarif === undefined || Number(tarif) === 0) return 'Gratuit';
  return Number(tarif).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}
