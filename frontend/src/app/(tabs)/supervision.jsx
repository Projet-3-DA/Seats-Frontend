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

export const FILTRES = [
  { cle: 'tous', label: 'Tous' },
  { cle: 'a_venir', label: 'À venir' },
  { cle: 'termines', label: 'Terminés' },
];

function garder(filtre) {
  if (filtre === 'a_venir') return (e) => !e.terminee;
  if (filtre === 'termines') return (e) => e.terminee;
  return () => true;
}

function EvenementCard({ item, theme }) {
  return (
    <Link href={`/admin/evenements/${item.id}`} asChild>
      <Pressable
        accessibilityLabel={`Voir le détail de ${item.titre}`}
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ])}
      >
        <Affiche uri={item.afficheUrl} style={styles.affiche} />
        <View style={styles.cardContenu}>
          <View style={styles.titreRow}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              {item.titre}
            </ThemedText>
            {item.terminee && (
              <View style={[styles.badge, { borderColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Terminé
                </ThemedText>
              </View>
            )}
          </View>
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
            <Feather name="user" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {`${item.organisateur.prenom} ${item.organisateur.nom}`}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Feather name="users" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {`${item.vendus} / ${item.totalSieges} sièges vendus`}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

// Supervision (#36) : l'administrateur voit tous les événements de la plateforme, passés compris,
// quel que soit l'organisateur, et ouvre le détail de chacun.
export default function SupervisionScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!token) return undefined;

      let cancelled = false;
      async function load() {
        setError('');
        try {
          const res = await fetch(`${API_URL}/admin/evenements`, { headers: { Authorization: `Bearer ${token}` } });
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
    }, [token]),
  );

  const visibles = evenements.filter(garder(filtre));

  return (
    <FlatList
      data={visibles}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <EvenementCard item={item} theme={theme} />}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.heading}>Tous les événements</ThemedText>
            <ThemedText themeColor="textSecondary">
              {loading ? 'Les événements de la plateforme, tous organisateurs confondus.' : `${evenements.length} événement(s) sur la plateforme, tous organisateurs confondus.`}
            </ThemedText>
          </View>
          <View style={styles.filtres}>
            {FILTRES.map(({ cle, label }) => {
              const actif = cle === filtre;
              return (
                <Pressable
                  key={cle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  onPress={() => setFiltre(cle)}
                  style={[
                    styles.filtre,
                    { borderColor: actif ? theme.primary : theme.border },
                    actif && { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText type="small" style={actif ? styles.filtreActifTexte : undefined}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
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
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {evenements.length === 0 ? "Aucun événement n'a encore été créé." : 'Aucun événement pour ce filtre.'}
          </ThemedText>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 24, gap: 16 },
  header: { gap: 12, marginBottom: 8 },
  headerText: { gap: 4 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtre: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  filtreActifTexte: { color: '#ffffff' },
  spinner: { marginTop: 8 },
  error: { color: '#DC2626' },
  empty: { textAlign: 'center', marginTop: 24 },
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  affiche: { width: 64, height: 96 },
  cardContenu: { flex: 1, gap: 6 },
  titreRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 18 },
});
