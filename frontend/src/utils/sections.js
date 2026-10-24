// Couleurs proposées pour les sections tarifaires (#11). Le vert, l'orange et le rouge des états
// libre / en sélection / vendu ne sont pas utilisés, pour ne pas confondre une section et un état.
export const COULEURS_SECTIONS = ['#2563eb', '#9333ea', '#0d9488', '#db2777', '#ca8a04', '#475569', '#0891b2', '#7c3aed'];

// Première couleur pas encore prise par une section ; on recommence la liste si toutes le sont.
export function prochaineCouleur(sections) {
  const prises = new Set(sections.map((s) => s.couleur));
  return COULEURS_SECTIONS.find((c) => !prises.has(c)) ?? COULEURS_SECTIONS[sections.length % COULEURS_SECTIONS.length];
}

// Vérifie les sections avant l'envoi et prépare le corps de PUT /salles/:id/sections.
// `assignation` associe l'id d'un siège à la clé locale de sa section.
// Renvoie { erreur } ou { sections } prêtes à envoyer.
export function preparerSections(sections, assignation, parsePrix) {
  const noms = new Set();
  const corps = [];
  for (const section of sections) {
    const nom = section.nom.trim();
    if (nom.length === 0) return { erreur: 'Chaque section doit avoir un nom.' };
    if (noms.has(nom.toLowerCase())) return { erreur: `Deux sections portent le nom « ${nom} ».` };
    noms.add(nom.toLowerCase());
    const prix = parsePrix(section.prixTexte);
    if (prix === null) return { erreur: `Prix invalide pour « ${nom} » (ex. 25 ou 25,50).` };
    const siegeIds = [...assignation.entries()].filter(([, cle]) => cle === section.cle).map(([id]) => id);
    if (siegeIds.length === 0) return { erreur: `La section « ${nom} » ne contient aucun siège.` };
    corps.push({ nom, prix, couleur: section.couleur, siegeIds });
  }
  return { sections: corps };
}
