import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

const COULEUR_TERMINE = '#16A34A';

function lettreRangee(numero) {
  return String.fromCharCode('A'.charCodeAt(0) + numero - 1);
}

function formaterSieges(sieges) {
  const parRangee = new Map();
  sieges.forEach((s) => {
    if (!parRangee.has(s.numeroRangee)) parRangee.set(s.numeroRangee, []);
    parRangee.get(s.numeroRangee).push(s.numeroColonne);
  });

  return Array.from(parRangee.entries())
    .sort(([a], [b]) => a - b)
    .map(([rangee, colonnes]) => {
      const numeros = colonnes.sort((a, b) => a - b).join(', ');
      const pluriel = colonnes.length > 1 ? 'Sièges' : 'Siège';
      return `Rangée ${lettreRangee(rangee)} ${pluriel} ${numeros}`;
    })
    .join(' · ');
}

function formaterDate(dateHeure) {
  return new Date(dateHeure).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formaterPrix(tarif, nombreSieges) {
  if (tarif == null) return null;
  return (Number(tarif) * nombreSieges).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function grouperReservations(reservations) {
  const groupes = new Map();
  reservations
    .filter((r) => r.statut !== 'en_selection')
    .forEach((r) => {
      const cle = `${r.evenementId}-${r.statut}`;
      if (!groupes.has(cle)) {
        groupes.set(cle, { id: cle, evenement: r.evenement, statut: r.statut, sieges: [] });
      }
      groupes.get(cle).sieges.push(r.siege);
    });

  return Array.from(groupes.values()).sort(
    (a, b) => new Date(b.evenement.dateHeure) - new Date(a.evenement.dateHeure)
  );
}

function statutAffiche(groupe, theme) {
  if (groupe.statut === 'annulee') {
    return { label: 'Annulée', couleur: theme.error };
  }
  const estPasse = new Date(groupe.evenement.dateHeure) < new Date();
  return estPasse ? { label: 'Terminé', couleur: COULEUR_TERMINE } : { label: 'À venir', couleur: theme.primary };
}

function TicketCard({ groupe, theme }) {
  const { label, couleur } = statutAffiche(groupe, theme);
  const prix = formaterPrix(groupe.evenement.tarif, groupe.sieges.length);
  const estPasseOuAnnule = groupe.statut !== 'confirmee' || new Date(groupe.evenement.dateHeure) < new Date();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.vignette, { backgroundColor: theme.backgroundSelected }]} />
        <View style={styles.cardHeaderText}>
          <ThemedText type="smallBold" style={styles.titre}>
            {groupe.evenement.titre}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formaterDate(groupe.evenement.dateHeure)}
          </ThemedText>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: couleur }]}>
              <ThemedText type="small" style={[styles.badgeTexte, { color: couleur }]}>
                {label}
              </ThemedText>
            </View>
            {prix && (
              <ThemedText type="smallBold" style={styles.prix}>
                {prix}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.separateur, { backgroundColor: theme.border }]} />

      <View style={styles.footerRow}>
        <View style={styles.siegesBloc}>
          <ThemedText type="small" themeColor="textSecondary">
            Sièges
          </ThemedText>
          <ThemedText type="small">{formaterSieges(groupe.sieges)}</ThemedText>
        </View>

        {estPasseOuAnnule ? (
          <Link href={`/(tabs)/events/${groupe.evenement.id}`} asChild>
            <Pressable style={[styles.bouton, { borderColor: theme.border }]}>
              <ThemedText type="small">Réserver à nouveau</ThemedText>
            </Pressable>
          </Link>
        ) : (
          <View style={styles.boutonsRow}>
            {/* Annulation et téléchargement du billet : à implémenter dans un autre récit (#12) */}
            <Pressable style={[styles.bouton, { borderColor: theme.error }]}>
              <ThemedText type="small" style={{ color: theme.error }}>
                Annuler
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.bouton, { borderColor: theme.border }]}>
              <ThemedText type="small">Billet PDF</ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MyReservationsScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/reservations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des réservations.');
        if (!cancelled) setReservations(json.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Échec du chargement des réservations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tickets = useMemo(() => grouperReservations(reservations), [reservations]);

  return (
    <FlatList
      data={tickets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TicketCard groupe={item} theme={theme} />}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.background }}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText style={styles.heading}>Vos Billets</ThemedText>
          <ThemedText themeColor="textSecondary">
            Retrouvez l'historique complet de vos spectacles réservés.
          </ThemedText>
          {loading && <ActivityIndicator style={styles.spinner} color={theme.primary} />}
          {error.length > 0 && (
            <ThemedText type="small" themeColor="error">
              {error}
            </ThemedText>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Vous n'avez aucune réservation.
          </ThemedText>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 24, gap: 16 },
  header: { gap: 8, marginBottom: 8 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  spinner: { marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', gap: 12 },
  vignette: { width: 48, height: 48, borderRadius: 8 },
  cardHeaderText: { flex: 1, gap: 6, justifyContent: 'center' },
  titre: { fontSize: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTexte: { fontSize: 12 },
  prix: { fontSize: 14 },
  separateur: { height: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  siegesBloc: { gap: 2, flex: 1 },
  boutonsRow: { flexDirection: 'row', gap: 8 },
  bouton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
});
