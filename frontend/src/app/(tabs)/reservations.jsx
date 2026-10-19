import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { lettreRangee } from '@/utils/salle';

const COULEUR_TERMINE = '#16A34A';

// Alert.alert() ne fait rien sur le web (react-native-web ne l'implémente pas) : on utilise
// window.confirm à la place sur cette plateforme, Alert natif ailleurs (iOS/Android).
function confirmer(titre, message) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titre}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(titre, message, [
      { text: 'Retour', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Annuler la réservation', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
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
  return (Number(tarif) * nombreSieges).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

function grouperReservations(reservations) {
  const groupes = new Map();
  reservations
    .filter((r) => r.statut !== 'en_selection')
    .forEach((r) => {
      const cle = `${r.evenementId}-${r.statut}`;
      if (!groupes.has(cle)) {
        groupes.set(cle, { id: cle, evenement: r.evenement, statut: r.statut, sieges: [], motifs: [], reservationIds: [] });
      }
      const groupe = groupes.get(cle);
      groupe.sieges.push(r.siege);
      groupe.reservationIds.push(r.id);
      // Motif donné par l'organisateur à l'annulation (#14), sans doublon si plusieurs sièges le partagent.
      if (r.motifAnnulation && !groupe.motifs.includes(r.motifAnnulation)) groupe.motifs.push(r.motifAnnulation);
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

function TicketCard({ groupe, theme, onAnnuler, annulationEnCours }) {
  const { label, couleur } = statutAffiche(groupe, theme);
  const prix = formaterPrix(groupe.evenement.tarif, groupe.sieges.length);
  const estPasse = new Date(groupe.evenement.dateHeure) < new Date();
  const peutReserverANouveau = groupe.statut === 'annulee' && !estPasse;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Affiche uri={groupe.evenement.afficheUrl} style={styles.vignette} />
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

      {groupe.motifs.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Motif de l'annulation : {groupe.motifs.join(' · ')}
        </ThemedText>
      )}

      <View style={[styles.separateur, { backgroundColor: theme.border }]} />

      <View style={styles.footerRow}>
        <View style={styles.siegesBloc}>
          <ThemedText type="small" themeColor="textSecondary">
            Sièges
          </ThemedText>
          <ThemedText type="small">{formaterSieges(groupe.sieges)}</ThemedText>
        </View>

        {peutReserverANouveau && (
          <Link href={`/(tabs)/events/${groupe.evenement.id}`} asChild>
            <Pressable style={{ ...styles.bouton, borderColor: theme.border }}>
              <ThemedText type="small">Réserver à nouveau</ThemedText>
            </Pressable>
          </Link>
        )}
        {groupe.statut === 'confirmee' && !estPasse && (
          <View style={styles.boutonsRow}>
            <Pressable
              style={[styles.bouton, { borderColor: theme.error, opacity: annulationEnCours ? 0.6 : 1 }]}
              onPress={() => onAnnuler(groupe)}
              disabled={annulationEnCours}
            >
              <ThemedText type="small" style={{ color: theme.error }}>
                {annulationEnCours ? 'Annulation…' : 'Annuler'}
              </ThemedText>
            </Pressable>
            {/* Téléchargement du billet : à implémenter dans un autre récit */}
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
  const [groupeEnAnnulation, setGroupeEnAnnulation] = useState(null);

  const charger = useCallback(async () => {
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
      setReservations(json.data);
    } catch (err) {
      setError(err.message || 'Échec du chargement des réservations.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await charger();
    })();
    return () => {
      cancelled = true;
    };
  }, [charger]);

  async function annulerGroupe(groupe) {
    const confirme = await confirmer(
      'Annuler cette réservation ?',
      `${groupe.evenement.titre} — les sièges seront libérés.`,
    );
    if (!confirme) return;

    setError('');
    setGroupeEnAnnulation(groupe.id);
    try {
      const reponses = await Promise.all(
        groupe.reservationIds.map((id) =>
          fetch(`${API_URL}/reservations/${id}/annuler`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      const echec = reponses.find((res) => !res.ok);
      if (echec) {
        const json = await echec.json();
        throw new Error(json.error || "Échec de l'annulation.");
      }
      await charger();
    } catch (err) {
      setError(err.message || "Échec de l'annulation.");
    } finally {
      setGroupeEnAnnulation(null);
    }
  }

  const tickets = useMemo(() => grouperReservations(reservations), [reservations]);

  return (
    <FlatList
      data={tickets}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TicketCard
          groupe={item}
          theme={theme}
          onAnnuler={annulerGroupe}
          annulationEnCours={groupeEnAnnulation === item.id}
        />
      )}
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
