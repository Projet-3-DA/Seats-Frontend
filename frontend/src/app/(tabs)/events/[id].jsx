import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { groupSiegesParRangee } from '@/utils/salle';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function EventSeatMapScreen() {
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();
  const theme = useTheme();
  const [plan, setPlan] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState(new Set());
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurReservation, setErreurReservation] = useState('');
  const [succes, setSucces] = useState(false);

  const peutReserver = user?.role === 'spectateur';

  // Renvoie le plan fraîchement chargé (ou null en cas d'erreur), pour que l'appelant puisse purger la
  // sélection des sièges qui viennent de changer d'état sans dépendre du re-render de `plan`.
  function chargerPlan() {
    setChargement(true);
    return fetch(`${API_URL}/evenements/${id}/plan`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then((json) => {
        setPlan(json.data);
        return json.data;
      })
      .catch((err) => {
        setErreur(err.message);
        return null;
      })
      .finally(() => setChargement(false));
  }

  // Un siège sélectionné peut être pris par quelqu'un d'autre avant qu'on ait confirmé : il n'est alors
  // plus cliquable (donc plus moyen de le désélectionner à la main), on le retire donc nous-mêmes dès
  // que le plan est rafraîchi.
  function purgerSelectionIndisponible(planFrais) {
    if (!planFrais) return;
    const siegesLibres = new Set(planFrais.sieges.filter((s) => s.etat === 'libre').map((s) => s.id));
    setSelection((precedente) => new Set([...precedente].filter((id) => siegesLibres.has(id))));
  }

  useEffect(() => {
    // Remet le chargement à true à chaque changement d'id (pas seulement au montage), pour que le
    // spinner réapparaisse en cas de navigation directe d'un événement à un autre.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection(new Set());
    chargerPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function basculerSelection(siege) {
    if (siege.etat !== 'libre') return;
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      if (suivante.has(siege.id)) suivante.delete(siege.id);
      else suivante.add(siege.id);
      return suivante;
    });
  }

  async function handleReserver() {
    if (selection.size === 0 || envoiEnCours) return;
    setEnvoiEnCours(true);
    setErreurReservation('');
    setSucces(false);
    try {
      const res = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ evenementId: Number(id), siegeIds: Array.from(selection) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Échec de la réservation.');
      }
      setSelection(new Set());
      setSucces(true);
      await chargerPlan();
    } catch (err) {
      setErreurReservation(err.message || 'Échec de la réservation.');
      // Un ou plusieurs sièges visés ont été pris entretemps : on remet le plan à jour et on retire de
      // la sélection ceux qui ne sont plus libres (les autres restent sélectionnés pour une nouvelle
      // tentative immédiate).
      purgerSelectionIndisponible(await chargerPlan());
    } finally {
      setEnvoiEnCours(false);
    }
  }

  if (chargement) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (erreur) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">Erreur : {erreur}</ThemedText>
      </ThemedView>
    );
  }

  const { rangees, numerosRangees } = groupSiegesParRangee(plan.sieges);

  function styleSiege(siege) {
    if (siege.etat === 'reserve') return styles.occupe;
    if (selection.has(siege.id)) return styles.selectionne;
    return styles.dispo;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{plan.salle.nom}</ThemedText>

      <View style={styles.grille}>
        {numerosRangees.map((rangee) => (
          <View key={rangee} style={styles.rangee}>
            {rangees[rangee].map((s) => (
              <Pressable
                key={s.id}
                testID={`siege-${s.id}`}
                onPress={() => basculerSelection(s)}
                disabled={!peutReserver || s.etat !== 'libre'}
                style={[styles.siege, styleSiege(s)]}
              >
                <ThemedText type="small" style={styles.siegeTexte}>
                  {s.colonne}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legende}>
        <View style={styles.legendeItem}>
          <View style={[styles.pastille, styles.dispo]} />
          <ThemedText type="small" themeColor="textSecondary">Dispo.</ThemedText>
        </View>
        <View style={styles.legendeItem}>
          <View style={[styles.pastille, styles.occupe]} />
          <ThemedText type="small" themeColor="textSecondary">Occupé</ThemedText>
        </View>
      </View>

      {!peutReserver && (
        <ThemedText type="small" themeColor="textSecondary">
          Connectez-vous en tant que spectateur pour réserver des sièges.
        </ThemedText>
      )}

      {erreurReservation.length > 0 && (
        <ThemedText type="small" style={styles.erreurTexte}>
          {erreurReservation}
        </ThemedText>
      )}

      {succes && selection.size === 0 && !erreurReservation && (
        <ThemedText type="small" style={styles.succesTexte}>
          Sièges réservés ! Vous avez 15 minutes pour confirmer.
        </ThemedText>
      )}

      {peutReserver && (
        <Pressable
          onPress={handleReserver}
          disabled={selection.size === 0 || envoiEnCours}
          style={[
            styles.bouton,
            { backgroundColor: theme.primary, opacity: selection.size === 0 || envoiEnCours ? 0.5 : 1 },
          ]}
        >
          <ThemedText type="smallBold" style={styles.boutonTexte}>
            {envoiEnCours
              ? 'Réservation…'
              : `Réserver ${selection.size > 0 ? `(${selection.size})` : ''}`.trim()}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grille: { gap: Spacing.two },
  rangee: { flexDirection: 'row', gap: Spacing.two },
  siege: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  siegeTexte: { color: '#ffffff' },
  dispo: { backgroundColor: '#22c55e' },
  occupe: { backgroundColor: '#ef4444' },
  selectionne: { backgroundColor: '#2563eb' },
  legende: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pastille: { width: 12, height: 12, borderRadius: 3 },
  bouton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  boutonTexte: { color: '#ffffff' },
  erreurTexte: { color: '#DC2626' },
  succesTexte: { color: '#16a34a' },
});
