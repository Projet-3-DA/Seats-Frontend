import { Link } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Sera remplacé par un appel à l'API (`GET /api/evenements`, récit #4).
const evenementsExemple = [];

export default function EventsListScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Événements à venir</ThemedText>
      <FlatList
        data={evenementsExemple}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/(tabs)/events/${item.id}`}>
            <ThemedText>{item.titre}</ThemedText>
          </Link>
        )}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary">Aucun événement à venir pour le moment.</ThemedText>
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