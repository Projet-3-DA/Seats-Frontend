import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { formatDelai } from '@/utils/dates';

// Composant à part : seul ce texte se redessine chaque seconde, pas tout le plan de salle (#37).
export function CompteARebours({ echeance }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuteur);
  }, []);

  return <ThemedText type="smallBold">Temps restant pour confirmer : {formatDelai(echeance - maintenant)}</ThemedText>;
}
