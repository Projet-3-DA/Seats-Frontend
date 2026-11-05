import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { CompteCard } from '@/components/compte-card';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';

// Deux vues : tous les événements (#36) ou tous les organisateurs inscrits (#19 du backlog).
export const VUES = [
  { cle: 'evenements', label: 'Événements', route: 'evenements' },
  { cle: 'organisateurs', label: 'Organisateurs', route: 'organisateurs' },
  // Comptes organisateurs et spectateurs, à suspendre ou réactiver (#20).
  { cle: 'comptes', label: 'Comptes', route: 'comptes' },
];

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

function OrganisateurCard({ item, theme }) {
  const nom = `${item.prenom} ${item.nom}`;
  return (
    <Link href={`/admin/organisateurs/${item.id}`} asChild>
      <Pressable
        accessibilityLabel={`Voir le détail de ${nom}`}
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ])}
      >
        <View style={styles.cardContenu}>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            {nom}
          </ThemedText>
          <View style={styles.metaRow}>
            <Feather name="mail" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {item.email}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {`${item.nombreEvenements} événement(s) · ${item.nombreSalles} salle(s)`}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

// Pastilles de choix, pour la vue comme pour le filtre des événements.
function Pastilles({ options, valeur, onChange, theme }) {
  return (
    <View style={styles.filtres}>
      {options.map(({ cle, label }) => {
        const actif = cle === valeur;
        return (
          <Pressable
            key={cle}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => onChange(cle)}
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
  );
}

const TEXTES = {
  evenements: {
    titre: 'Tous les événements',
    chargement: 'Les événements de la plateforme, tous organisateurs confondus.',
    compte: (n) => `${n} événement(s) sur la plateforme, tous organisateurs confondus.`,
    erreur: 'Échec du chargement des événements.',
  },
  organisateurs: {
    titre: 'Tous les organisateurs',
    chargement: 'Les organisateurs inscrits sur la plateforme.',
    compte: (n) => `${n} organisateur(s) inscrit(s) sur la plateforme.`,
    erreur: 'Échec du chargement des organisateurs.',
  },
  comptes: {
    titre: 'Comptes',
    chargement: 'Les comptes organisateurs et spectateurs de la plateforme.',
    compte: (n) => `${n} compte(s). Un compte suspendu est conservé et peut être réactivé.`,
    erreur: 'Échec du chargement des comptes.',
  },
};

// Supervision : l'administrateur voit tous les événements de la plateforme, passés compris, quel que
// soit l'organisateur (#36), ou tous les organisateurs inscrits avec leur nombre d'événements (#19 du
// backlog), et ouvre le détail de chacun.
export default function SupervisionScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [vue, setVue] = useState('evenements');
  const [donnees, setDonnees] = useState({ evenements: [], organisateurs: [], comptes: [] });
  const [filtre, setFiltre] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!token) return undefined;

      let cancelled = false;
      async function load() {
        setError('');
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/admin/${vue}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error || TEXTES[vue].erreur);
          if (!cancelled) setDonnees((d) => ({ ...d, [vue]: json.data }));
        } catch (err) {
          if (!cancelled) setError(err.message || TEXTES[vue].erreur);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, [token, vue]),
  );

  const { evenements } = donnees;
  const textes = TEXTES[vue];
  const liste = donnees[vue];
  const visibles = vue === 'evenements' ? evenements.filter(garder(filtre)) : liste;

  // Après une suspension ou une réactivation, la carte affiche tout de suite le nouveau statut.
  const majCompte = useCallback(
    (compte) =>
      setDonnees((d) => ({ ...d, comptes: d.comptes.map((c) => (c.id === compte.id ? { ...c, ...compte } : c)) })),
    [],
  );

  function renderItem({ item }) {
    if (vue === 'evenements') return <EvenementCard item={item} theme={theme} />;
    if (vue === 'comptes') return <CompteCard compte={item} token={token} onMaj={majCompte} />;
    return <OrganisateurCard item={item} theme={theme} />;
  }

  return (
    <FlatList
      data={visibles}
      keyExtractor={(item) => `${vue}-${item.id}`}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pastilles options={VUES} valeur={vue} onChange={setVue} theme={theme} />
          <View style={styles.headerText}>
            <ThemedText style={styles.heading}>{textes.titre}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {loading ? textes.chargement : textes.compte(liste.length)}
            </ThemedText>
          </View>
          {vue === 'evenements' && <Pastilles options={FILTRES} valeur={filtre} onChange={setFiltre} theme={theme} />}
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
            {vue === 'comptes'
              ? "Aucun compte organisateur ou spectateur n'existe encore."
              : vue === 'organisateurs'
              ? "Aucun organisateur n'est encore inscrit."
              : evenements.length === 0
                ? "Aucun événement n'a encore été créé."
                : 'Aucun événement pour ce filtre.'}
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
