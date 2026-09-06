import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NouvelEvenementScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Créer un événement</ThemedText>
      <ThemedText themeColor="textSecondary">
        Formulaire (titre, description, date, lieu, salle) à implémenter (récit #3).
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
});
