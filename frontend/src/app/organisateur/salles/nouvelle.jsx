import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NouvelleSalleScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Créer une salle</ThemedText>
      <ThemedText themeColor="textSecondary">
        Formulaire (nom, nombre de rangées, sièges par rangée) à implémenter (récit #2).
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
});
