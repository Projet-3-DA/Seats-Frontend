import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';
import { filtrerEvenements, parseDate, sallesDisponibles } from '@/utils/filtres-evenements';

function ChampDate({ label, value, onChangeText, invalide, theme }) {
  return (
    <View style={styles.dateField}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        style={[styles.dateInput, { color: theme.text, borderColor: invalide ? '#DC2626' : theme.border }]}
      />
    </View>
  );
}

function Puce({ label, actif, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      style={[
        styles.puce,
        { borderColor: actif ? theme.primary : theme.border, backgroundColor: actif ? theme.primary : 'transparent' },
      ]}>
      <ThemedText type="small" style={actif ? styles.buttonText : { color: theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function EventCard({ item, theme, peutReserver }) {
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
        {peutReserver && (
          <Link href={`/(tabs)/events/${item.id}`} asChild>
            <Pressable style={StyleSheet.flatten([styles.button, { backgroundColor: theme.primary }])}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                Réserver mes places
              </ThemedText>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}

export default function EventsListScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  // Seul un spectateur peut réserver (le serveur le vérifie aussi). Un visiteur non connecté garde le
  // bouton : c'est son chemin vers la connexion. Organisateur et administrateur consultent seulement (#87).
  const peutReserver = !user || user.role === 'spectateur';
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recherche, setRecherche] = useState('');
  const [salleId, setSalleId] = useState(null);
  const [duTexte, setDuTexte] = useState('');
  const [auTexte, setAuTexte] = useState('');

  // Les écrans d'onglets restent montés : un useEffect ne chargerait la liste qu'une fois, et un
  // événement créé entre-temps n'apparaîtrait qu'après un rafraîchissement. On recharge donc à
  // chaque fois que l'écran reprend le focus.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const res = await fetch(`${API_URL}/evenements`);
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des événements.');
          if (!cancelled) {
            setEvenements(json.data);
            setError('');
          }
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
    }, []),
  );

  const salles = useMemo(() => sallesDisponibles(evenements), [evenements]);
  // Une date tant qu'elle n'est pas complète ou valide ne filtre pas : on la signale seulement.
  const du = useMemo(() => parseDate(duTexte), [duTexte]);
  const au = useMemo(() => parseDate(auTexte), [auTexte]);
  const duInvalide = duTexte.trim().length > 0 && !du;
  const auInvalide = auTexte.trim().length > 0 && !au;
  const plageInversee = du && au && du > au;
  const filtreActif = recherche.trim().length > 0 || salleId !== null || duTexte.length > 0 || auTexte.length > 0;

  const evenementsFiltres = useMemo(
    () => filtrerEvenements(evenements, { recherche, salleId, du, au }),
    [evenements, recherche, salleId, du, au],
  );

  function reinitialiserFiltres() {
    setRecherche('');
    setSalleId(null);
    setDuTexte('');
    setAuTexte('');
  }

  return (
    <FlatList
      data={evenementsFiltres}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <EventCard item={item} theme={theme} peutReserver={peutReserver} />}
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
          {salles.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.puces}>
              <Puce label="Toutes les salles" actif={salleId === null} onPress={() => setSalleId(null)} theme={theme} />
              {salles.map((s) => (
                <Puce key={s.id} label={s.nom} actif={salleId === s.id} onPress={() => setSalleId(s.id)} theme={theme} />
              ))}
            </ScrollView>
          )}
          <View style={styles.dateRow}>
            <ChampDate label="Du" value={duTexte} onChangeText={setDuTexte} invalide={duInvalide} theme={theme} />
            <ChampDate label="Au" value={auTexte} onChangeText={setAuTexte} invalide={auInvalide} theme={theme} />
          </View>
          {(duInvalide || auInvalide) && (
            <ThemedText type="small" style={styles.error}>
              Saisissez une date valide au format JJ/MM/AAAA.
            </ThemedText>
          )}
          {plageInversee && (
            <ThemedText type="small" style={styles.error}>
              La date de début est après la date de fin.
            </ThemedText>
          )}
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
        loading || error ? null : evenements.length > 0 && filtreActif ? (
          <View style={styles.emptyFiltres}>
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Aucun événement ne correspond à vos filtres.
            </ThemedText>
            <Pressable onPress={reinitialiserFiltres} accessibilityRole="button">
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Réinitialiser les filtres
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Aucun événement à venir pour le moment.
          </ThemedText>
        )
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
  emptyFiltres: { alignItems: 'center', gap: 12 },
  puces: { gap: 8 },
  puce: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1, gap: 4 },
  dateInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
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
