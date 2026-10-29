import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatMontant } from '@/utils/tarif';

// Bordure d'un siège sur un plan (#34) : la couleur de sa section. Le fond reste réservé à l'état
// (libre, vendu…), la section ne fait que l'encadrer. Rien pour un siège hors section.
export function styleSection(siege, sections = []) {
  const section = sections.find((s) => s.id === siege.sectionId);
  return section ? { borderWidth: 3, borderColor: section.couleur } : null;
}

// Légende des sections tarifaires d'un plan (#34) : nom et prix sous la couleur de chacune.
// Rien n'est affiché pour une salle au tarif unique.
export function LegendeSections({ sections = [] }) {
  if (sections.length === 0) return null;
  return (
    <View style={styles.legende}>
      {sections.map((s) => (
        <View key={s.id} style={styles.item}>
          <View style={[styles.cadre, { borderColor: s.couleur }]} />
          <ThemedText type="small" themeColor="textSecondary">
            {s.nom} · {formatMontant(s.prix)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cadre: { width: 14, height: 14, borderRadius: 3, borderWidth: 3 },
});
