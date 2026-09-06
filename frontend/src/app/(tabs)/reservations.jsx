import { FlatList, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Sera remplacé par un appel à l'API (`GET /api/reservations`, récit #7).
const reservationsExemple = [];

export default function MyReservationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mes réservations</ThemedText>
      <FlatList
        data={reservationsExemple}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ThemedText>{item.evenement}</ThemedText>}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary">Vous n'avez aucune réservation.</ThemedText>
        }
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  list: { gap: 12 },
});
