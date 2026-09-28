import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateHeure } from '@/utils/dates';
import { formatTarif } from '@/utils/tarif';

function EventCard({ item, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Affiche uri={item.afficheUrl} style={styles.affiche} />
      <View style={styles.cardContent}>
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
          <Feather name="dollar-sign" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatTarif(item.tarif)}
          </ThemedText>
        </View>
        <Link href={`/(tabs)/events/${item.id}`} asChild>
          <Pressable style={StyleSheet.flatten([styles.button, { backgroundColor: theme.primary }])}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Réserver mes places
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function EventsListScreen() {
  const theme = useTheme();
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/evenements`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des événements.');
        if (!cancelled) setEvenements(json.data);
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
  }, []);

  const evenementsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return evenements;
    return evenements.filter((e) => e.titre.toLowerCase().includes(q));
  }, [evenements, recherche]);

  return (
    <FlatList
      data={evenementsFiltres}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <EventCard item={item} theme={theme} />}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={[styles.searchRow, { borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher un spectacle..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
          <ThemedText style={styles.heading}>Événements à l'affiche</ThemedText>
          <ThemedText themeColor="textSecondary">
            Découvrez et réservez les meilleures places pour vos spectacles.
          </ThemedText>
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
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aucun événement à venir pour le moment.
          </ThemedText>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 24, gap: 16, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: 12, marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  spinner: { marginTop: 8 },
  error: { color: '#DC2626' },
  empty: { textAlign: 'center', marginTop: 24 },
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardContent: { flex: 1, gap: 8 },
  // Taille fixe (comme l'aperçu dans organisateur/evenements/nouveau.jsx) : une largeur en %
  // de la carte ferait grimper la hauteur avec elle (aspectRatio) et n'afficherait plus
  // qu'un seul événement à l'écran sur les cartes larges (desktop).
  affiche: { width: 96, height: 144 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 18 },
  button: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#ffffff' },
});
