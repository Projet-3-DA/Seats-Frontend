import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';
import { formatTarif } from '@/utils/tarif';

function EvenementCard({ item, theme }) {
  return (
    <Link href={`/(tabs)/events/${item.id}`} asChild>
      <Pressable
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ])}
      >
        <Affiche uri={item.afficheUrl} style={styles.affiche} />
        <View style={styles.cardContenu}>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            {item.titre}
          </ThemedText>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateHeure(item.dateHeure)}
            </ThemedText>
          </View>
          {item.salle?.nom && (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {item.salle.nom}
              </ThemedText>
            </View>
          )}
          <View style={styles.metaRow}>
            <Feather name="tag" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatTarif(item.tarif)}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function MesEvenementsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // À chaque retour sur l'onglet (par exemple après la création d'un événement), la liste est rechargée.
  useFocusEffect(
    useCallback(() => {
      // L'API renvoie tous les événements : on ne garde que ceux de l'organisateur connecté.
      if (!user) return undefined;

      let cancelled = false;
      async function load() {
        setError('');
        try {
          const res = await fetch(`${API_URL}/evenements`);
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des événements.');
          if (!cancelled) setEvenements(json.data.filter((e) => e.organisateurId === user.id));
        } catch (err) {
          if (!cancelled) setError(err.message || 'Échec du chargement des événements.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  return (
    <FlatList
      data={evenements}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <EvenementCard item={item} theme={theme} />}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <ThemedText style={styles.heading}>Mes événements</ThemedText>
              <ThemedText themeColor="textSecondary">Les événements que vous avez créés.</ThemedText>
            </View>
            <Link href="/organisateur/evenements/nouveau" asChild>
              <Pressable
                accessibilityLabel="Créer un événement"
                style={StyleSheet.flatten([styles.addButton, { backgroundColor: theme.primary }])}
              >
                <Feather name="plus" size={20} color="#ffffff" />
              </Pressable>
            </Link>
          </View>
          {loading && <ActivityIndicator style={styles.spinner} color={theme.primary} />}
          {error.length > 0 && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Vous n'avez encore créé aucun événement.
            </ThemedText>
            <Link href="/organisateur/evenements/nouveau">
              <ThemedText type="link" style={{ color: theme.primary }}>
                Créer un événement
              </ThemedText>
            </Link>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 24, gap: 16 },
  header: { gap: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, gap: 4 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: 8 },
  error: { color: '#DC2626' },
  empty: { alignItems: 'center', gap: 8, marginTop: 24 },
  center: { textAlign: 'center' },
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  affiche: { width: 64, height: 96 },
  cardContenu: { flex: 1, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 18 },
});
