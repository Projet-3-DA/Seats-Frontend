import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { capaciteSalle } from '@/utils/salle';

function SalleCard({ item, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Feather name="grid" size={18} color={theme.primary} />
        <ThemedText type="smallBold" style={styles.cardTitle}>
          {item.nom}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {item.nombreRangees} rangées × {item.siegesParRangee} sièges · {capaciteSalle(item)} places
      </ThemedText>
    </View>
  );
}

export default function MesSallesScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // À chaque retour sur l'onglet (par exemple après la création d'une salle), la liste est rechargée.
  useFocusEffect(
    useCallback(() => {
      // Au premier rendu, AuthProvider relit encore le token depuis le storage (async) : il vaut null
      // un court instant. Attendre qu'il soit disponible évite un aller-retour 401 parasite.
      if (!token) return undefined;

      let cancelled = false;
      async function load() {
        setError('');
        try {
          const res = await fetch(`${API_URL}/salles`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des salles.');
          if (!cancelled) setSalles(json.data);
        } catch (err) {
          if (!cancelled) setError(err.message || 'Échec du chargement des salles.');
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

  return (
    <FlatList
      data={salles}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <SalleCard item={item} theme={theme} />}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <ThemedText style={styles.heading}>Mes salles</ThemedText>
              <ThemedText themeColor="textSecondary">Les salles que vous avez créées.</ThemedText>
            </View>
            <Link href="/organisateur/salles/nouvelle" asChild>
              <Pressable
                accessibilityLabel="Créer une salle"
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
              Vous n'avez encore créé aucune salle.
            </ThemedText>
            <Link href="/organisateur/salles/nouvelle">
              <ThemedText type="link" style={{ color: theme.primary }}>
                Créer une salle
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
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 18 },
});
