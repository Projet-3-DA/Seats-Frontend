// tarif est null en base pour un événement gratuit ; sinon un Decimal Prisma sérialisé en string.
export function formatTarif(tarif) {
  if (tarif === null || tarif === undefined) return 'Gratuit';
  return Number(tarif).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}
