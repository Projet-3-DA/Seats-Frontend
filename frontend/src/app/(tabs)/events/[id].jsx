import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { io } from 'socket.io-client';

import { API_URL, SOCKET_URL } from '@/constants/api';
import { groupSiegesParRangee, lettreRangee } from '@/utils/salle';
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
  const [enConfirmation, setEnConfirmation] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurReservation, setErreurReservation] = useState('');
  const [succes, setSucces] = useState(false);
  // Sièges en cours de sélection par d'autres spectateurs, diffusés en temps réel (#8).
  const [selectionsAutres, setSelectionsAutres] = useState(new Set());
  const socketRef = useRef(null);

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

  // La déconnexion (départ de la page) libère côté serveur les sièges qu'on tenait encore.
  useEffect(() => {
    const evenementId = Number(id);
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    const retirer = (ensemble, ids) => new Set([...ensemble].filter((s) => !ids.includes(s)));

    socket.on('connect', () => socket.emit('plan:rejoindre', evenementId));
    socket.on('plan:selections', ({ siegeIds }) => setSelectionsAutres(new Set(siegeIds)));
    socket.on('siege:selectionne', ({ siegeId }) => setSelectionsAutres((p) => new Set(p).add(siegeId)));
    // Libéré par l'autre, ou délai d'une minute écoulé (y compris pour notre propre sélection).
    socket.on('siege:libere', ({ siegeId }) => {
      setSelectionsAutres((p) => retirer(p, [siegeId]));
      setSelection((p) => retirer(p, [siegeId]));
    });
    socket.on('sieges:reserves', ({ siegeIds }) => {
      setSelectionsAutres((p) => retirer(p, siegeIds));
      setPlan((p) => p && { ...p, sieges: p.sieges.map((s) => (siegeIds.includes(s.id) ? { ...s, etat: 'reserve' } : s)) });
    });

    return () => {
      socket.disconnect();
      setSelectionsAutres(new Set());
    };
  }, [id, token]);

  function basculerSelection(siege) {
    if (siege.etat !== 'libre' || selectionsAutres.has(siege.id)) return;
    const evenementId = Number(id);
    if (selection.has(siege.id)) {
      socketRef.current?.emit('siege:deselectionner', { evenementId, siegeId: siege.id });
      setSelection((p) => {
        const suivante = new Set(p);
        suivante.delete(siege.id);
        return suivante;
      });
      return;
    }
    // Le serveur arbitre : si quelqu'un l'a pris une fraction de seconde avant nous, il refuse (#31).
    socketRef.current?.emit('siege:selectionner', { evenementId, siegeId: siege.id }, (reponse) => {
      if (!reponse?.ok) {
        setErreurReservation(reponse?.error || 'Ce siège ne peut pas être sélectionné.');
        return;
      }
      setErreurReservation('');
      setSelection((p) => new Set(p).add(siege.id));
    });
  }

  // « Réserver » n'enregistre rien : il ouvre le récapitulatif. C'est « Confirmer » qui écrit la réservation.
  function demanderConfirmation() {
    if (selection.size === 0) return;
    setErreurReservation('');
    setSucces(false);
    setEnConfirmation(true);
  }

  async function handleConfirmer() {
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
      setEnConfirmation(false);
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

  // Un événement passé n'apparaît plus dans la liste, mais reste joignable par un lien direct (#82).
  const estTermine = Boolean(plan.dateHeure) && new Date(plan.dateHeure) <= new Date();
  const reservationOuverte = peutReserver && !estTermine;

  const { rangees, numerosRangees } = groupSiegesParRangee(plan.sieges);
  const siegesChoisis = plan.sieges
    .filter((s) => selection.has(s.id))
    .sort((a, b) => a.rangee - b.rangee || a.colonne - b.colonne);

  function styleSiege(siege) {
    if (siege.etat === 'reserve') return styles.occupe;
    if (selection.has(siege.id)) return styles.selectionne;
    if (selectionsAutres.has(siege.id)) return styles.enSelection;
    return styles.dispo;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{plan.salle.nom}</ThemedText>

      <View style={styles.grille}>
        {numerosRangees.map((rangee) => (
          <View key={rangee} style={styles.rangee}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.lettreRangee}>
              {lettreRangee(rangee)}
            </ThemedText>
            {rangees[rangee].map((s) => (
              <Pressable
                key={s.id}
                testID={`siege-${s.id}`}
                onPress={() => basculerSelection(s)}
                disabled={!reservationOuverte || s.etat !== 'libre' || selectionsAutres.has(s.id) || enConfirmation}
                style={[styles.siege, styleSiege(s)]}
              >
                <ThemedText type="small" style={styles.siegeTexte}>
                  {s.colonne}
                </ThemedText>
              </Pressable>
            ))}
            <ThemedText type="small" themeColor="textSecondary" style={styles.lettreRangee}>
              {lettreRangee(rangee)}
            </ThemedText>
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
        <View style={styles.legendeItem}>
          <View style={[styles.pastille, styles.selectionne]} />
          <ThemedText type="small" themeColor="textSecondary">Ma sélection</ThemedText>
        </View>
        <View style={styles.legendeItem}>
          <View style={[styles.pastille, styles.enSelection]} />
          <ThemedText type="small" themeColor="textSecondary">En sélection par un autre</ThemedText>
        </View>
      </View>

      {estTermine && (
        <ThemedText type="smallBold" style={styles.erreurTexte}>
          Événement terminé : il n'est plus possible de réserver.
        </ThemedText>
      )}

      {!user && !estTermine && (
        <ThemedText type="small" themeColor="textSecondary">
          Connectez-vous en tant que spectateur pour réserver des sièges.
        </ThemedText>
      )}

      {user && !peutReserver && (
        <ThemedText type="small" themeColor="textSecondary">
          Plan en consultation seulement : la réservation est réservée aux spectateurs.
        </ThemedText>
      )}

      {erreurReservation.length > 0 && (
        <ThemedText type="small" style={styles.erreurTexte}>
          {erreurReservation}
        </ThemedText>
      )}

      {succes && selection.size === 0 && !erreurReservation && (
        <ThemedText type="small" style={styles.succesTexte}>
          Réservation confirmée !
        </ThemedText>
      )}

      {reservationOuverte && enConfirmation && (
        <View
          style={[styles.recapitulatif, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <ThemedText type="smallBold">Confirmer votre réservation</ThemedText>
          {siegesChoisis.map((s) => (
            <ThemedText key={s.id} type="small" themeColor="textSecondary">
              Rangée {lettreRangee(s.rangee)}, siège {s.colonne}
            </ThemedText>
          ))}
          <Pressable
            onPress={handleConfirmer}
            disabled={envoiEnCours}
            style={[styles.bouton, { backgroundColor: theme.primary, opacity: envoiEnCours ? 0.5 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.boutonTexte}>
              {envoiEnCours ? 'Confirmation…' : 'Confirmer'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setEnConfirmation(false)}
            disabled={envoiEnCours}
            style={[styles.bouton, styles.boutonSecondaire, { borderColor: theme.border }]}
          >
            <ThemedText type="smallBold">Modifier ma sélection</ThemedText>
          </Pressable>
        </View>
      )}

      {reservationOuverte && !enConfirmation && (
        <Pressable
          onPress={demanderConfirmation}
          disabled={selection.size === 0}
          style={[styles.bouton, { backgroundColor: theme.primary, opacity: selection.size === 0 ? 0.5 : 1 }]}
        >
          <ThemedText type="smallBold" style={styles.boutonTexte}>
            {`Réserver ${selection.size > 0 ? `(${selection.size})` : ''}`.trim()}
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
  rangee: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  lettreRangee: { width: 16, textAlign: 'center' },
  siege: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  siegeTexte: { color: '#ffffff' },
  dispo: { backgroundColor: '#22c55e' },
  occupe: { backgroundColor: '#ef4444' },
  selectionne: { backgroundColor: '#2563eb' },
  enSelection: { backgroundColor: '#eab308' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four, marginTop: Spacing.two },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pastille: { width: 12, height: 12, borderRadius: 3 },
  bouton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  boutonSecondaire: { borderWidth: 1 },
  recapitulatif: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  boutonTexte: { color: '#ffffff' },
  erreurTexte: { color: '#DC2626' },
  succesTexte: { color: '#16a34a' },
});
