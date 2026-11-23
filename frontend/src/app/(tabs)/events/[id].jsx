import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LegendeSections, styleSection } from '@/components/legende-sections';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { io } from 'socket.io-client';

import { API_URL, SOCKET_URL } from '@/constants/api';
import { groupSiegesParRangee, lettreRangee } from '@/utils/salle';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { formatMontant } from '@/utils/tarif';

const MESSAGE_PLAFOND =
  'Vous avez gardé vos sièges plus de 3 minutes : ils ont tous été libérés. Sélectionnez-les à nouveau pour réserver.';

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
  // Sièges que le spectateur avait choisis mais qui ont été pris pendant sa confirmation (#39) : on les
  // signale sur le plan et dans le message, jusqu'à sa prochaine action.
  const [siegesPerdus, setSiegesPerdus] = useState(new Set());
  // Échéance commune à toute la sélection (#37), fournie par le serveur : un seul compte à rebours pour
  // tous les sièges choisis, repoussé à chaque nouveau siège plutôt que suivi siège par siège.
  const [echeance, setEcheance] = useState(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const socketRef = useRef(null);
  // Copie de la sélection lisible depuis les écouteurs du socket et après un `await`.
  const selectionRef = useRef(selection);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const peutReserver = user?.role === 'spectateur';

  // Renvoie le plan fraîchement chargé (ou null en cas d'erreur), pour que l'appelant puisse purger la
  // sélection des sièges qui viennent de changer d'état sans dépendre du re-render de `plan`.
  // `enArrierePlan` : rechargement d'un plan déjà affiché ; un échec ne doit pas remplacer toute la page
  // par un message d'erreur, le spectateur garde le dernier plan connu.
  function chargerPlan({ enArrierePlan = false } = {}) {
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
        if (!enArrierePlan) setErreur(err.message);
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
    retirerSiegesPerdus([...selectionRef.current].filter((id) => !siegesLibres.has(id)));
  }

  // Retire de ma sélection les sièges qu'un autre a pris, et les garde en mémoire pour les signaler.
  function retirerSiegesPerdus(ids) {
    const perdus = ids.filter((id) => selectionRef.current.has(id));
    if (perdus.length === 0) return;
    selectionRef.current = new Set([...selectionRef.current].filter((id) => !perdus.includes(id)));
    setSelection((p) => new Set([...p].filter((id) => !perdus.includes(id))));
    setSiegesPerdus((p) => new Set([...p, ...perdus]));
    // Plus rien à compter : le compte à rebours disparaît avec la dernière sélection (#37).
    if (selectionRef.current.size === 0) setEcheance(null);
  }

  useEffect(() => {
    // Remet le chargement à true à chaque changement d'id (pas seulement au montage), pour que le
    // spinner réapparaisse en cas de navigation directe d'un événement à un autre.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection(new Set());
    setPlan(null);
    chargerPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fait avancer le compte à rebours (#37) toutes les secondes, seulement pendant qu'il y a une
  // échéance à afficher : inutile de faire tourner un minuteur sans sélection.
  useEffect(() => {
    if (echeance === null) return undefined;
    const minuterie = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuterie);
  }, [echeance]);

  // La déconnexion (départ de la page) libère côté serveur les sièges qu'on tenait encore.
  useEffect(() => {
    const evenementId = Number(id);
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    const retirer = (ensemble, ids) => new Set([...ensemble].filter((s) => !ids.includes(s)));

    socket.on('connect', () => socket.emit('plan:rejoindre', evenementId));
    // Liste complète des sièges tenus par les autres : envoyée en rejoignant le plan, et de nouveau
    // après un échec de confirmation (#39). Un siège qu'un autre tient ne peut plus être dans ma sélection.
    socket.on('plan:selections', ({ siegeIds }) => {
      setSelectionsAutres(new Set(siegeIds));
      retirerSiegesPerdus(siegeIds);
    });
    socket.on('siege:selectionne', ({ siegeId }) => setSelectionsAutres((p) => new Set(p).add(siegeId)));
    // Un siège qu'un autre spectateur vient de libérer (ou que j'ai moi-même désélectionné : l'écho de
    // ma propre action, déjà appliquée localement, ne fait alors rien ici).
    socket.on('siege:libere', ({ siegeId }) => setSelectionsAutres((p) => retirer(p, [siegeId])));
    // Minuteur partagé écoulé (#37) : le serveur libère d'un coup toute ma sélection sur cet événement,
    // jamais siège par siège, donc un seul message plutôt qu'un par siège et le compte à rebours disparaît.
    socket.on('sieges:liberes', ({ siegeIds }) => {
      setSelectionsAutres((p) => retirer(p, siegeIds));
      // `selectionRef` (pas l'updater de setSelection, qui doit rester pur) détermine si l'échéance
      // concernait ma sélection, pour le message et pour vider le compte à rebours.
      const miennes = siegeIds.filter((siegeId) => selectionRef.current.has(siegeId));
      if (miennes.length === 0) return;
      setEcheance(null);
      setErreurReservation(
        miennes.length === 1
          ? 'Le délai de sélection a expiré : votre siège a été libéré, sélectionnez à nouveau.'
          : 'Le délai de sélection a expiré : vos sièges ont été libérés, sélectionnez à nouveau.',
      );
      setSelection((p) => retirer(p, siegeIds));
    });
    // Plafond de 3 minutes atteint (#163) : le serveur libère toute ma sélection d'un coup. Il l'annonce
    // avant les `siege:libere`, pour qu'on explique pourquoi au lieu de vider la sélection sans un mot.
    socket.on('selection:plafond', () => {
      selectionRef.current = new Set();
      setSelection(new Set());
      setEnConfirmation(false);
      // Plus aucun siège : le compte à rebours des 60 s (#37) disparaît avec la sélection.
      setEcheance(null);
      setErreurReservation(MESSAGE_PLAFOND);
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
    if (siege.etat !== 'libre') return;
    // Sans ce message, cliquer sur un siège déjà en cours de sélection par quelqu'un d'autre ne faisait
    // rien du tout (#16/#17) : on le laisse jaune/bloqué, mais on explique pourquoi au lieu de rester muet.
    if (selectionsAutres.has(siege.id)) {
      setErreurReservation("Ce siège est en cours de sélection par quelqu'un d'autre.");
      return;
    }
    setSiegesPerdus(new Set());
    const evenementId = Number(id);
    if (selection.has(siege.id)) {
      socketRef.current?.emit('siege:deselectionner', { evenementId, siegeId: siege.id });
      // Plus rien à compter si c'était le dernier (#37) ; sinon l'échéance commune des autres ne bouge pas.
      if (selection.size === 1) setEcheance(null);
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
      // delaiMs vient du serveur (#37), déjà repoussé pour toute la sélection existante côté serveur :
      // une seule échéance pour tous les sièges, pas une par siège. Absent (vieux client/serveur
      // désynchronisés) : pas de compte à rebours affiché plutôt que d'en inventer un.
      if (reponse.delaiMs) {
        setMaintenant(Date.now());
        setEcheance(Date.now() + reponse.delaiMs);
      }
    });
  }

  // « Réserver » n'enregistre rien : il ouvre le récapitulatif. C'est « Confirmer » qui écrit la réservation.
  function demanderConfirmation() {
    if (selection.size === 0) return;
    setErreurReservation('');
    setSiegesPerdus(new Set());
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
      setEcheance(null);
      setSucces(true);
      await chargerPlan({ enArrierePlan: true });
    } catch (err) {
      // fetch lui-même échoue (TypeError) quand le serveur est injoignable : son message est technique.
      setErreurReservation(
        err instanceof TypeError
          ? 'Connexion au serveur impossible : votre réservation n’a pas été enregistrée. Réessayez.'
          : err.message || 'Échec de la réservation.',
      );
      // Un ou plusieurs sièges visés ont été pris entretemps (#39) : on remet le plan à jour sans que le
      // spectateur recharge la page, et on retire de la sélection ceux qui ne sont plus libres (les autres
      // restent sélectionnés pour une nouvelle tentative immédiate). Les sièges tenus par un autre ne
      // figurent pas dans le plan : on redemande aussi leur liste au serveur temps réel.
      socketRef.current?.emit('plan:rejoindre', Number(id));
      purgerSelectionIndisponible(await chargerPlan({ enArrierePlan: true }));
    } finally {
      setEnvoiEnCours(false);
      setEnConfirmation(false);
    }
  }

  // Sélection vidée pendant le récapitulatif (délai d'une minute écoulé) : plus rien à confirmer.
  if (enConfirmation && selection.size === 0 && !envoiEnCours) setEnConfirmation(false);

  // Le spinner ne remplace le plan qu'au premier chargement. Un rechargement (après « Confirmer »)
  // garde le plan affiché : la page ne remonte pas en haut et le spectateur voit le message du résultat,
  // sous le plan, là où il vient de cliquer.
  if (chargement && !plan) {
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
  // Prix de chaque siège : celui de sa section, ou le tarif de l'événement (#11). null si inconnu.
  const prixConnus = siegesChoisis.every((s) => s.prix !== null && s.prix !== undefined);
  const nomSiege = (s) => `rangée ${lettreRangee(s.rangee)}, siège ${s.colonne}`;
  const nomsPerdus = plan.sieges
    .filter((s) => siegesPerdus.has(s.id))
    .sort((a, b) => a.rangee - b.rangee || a.colonne - b.colonne)
    .map(nomSiege);
  const total = siegesChoisis.reduce((somme, s) => somme + (s.prix ?? 0), 0);

  // Temps restant avant expiration (#37) : une seule échéance pour toute la sélection.
  const secondesRestantes = echeance !== null ? Math.max(0, Math.ceil((echeance - maintenant) / 1000)) : null;

  function styleSiege(siege) {
    if (siege.etat === 'reserve') return styles.occupe;
    if (selection.has(siege.id)) return styles.selectionne;
    if (selectionsAutres.has(siege.id)) return styles.enSelection;
    return styles.dispo;
  }

  // Le plan d'une grande salle dépasse l'écran : la page défile verticalement, et la grille seule
  // horizontalement quand elle est plus large que l'écran.
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator
    >
      <ThemedText type="title">{plan.salle.nom}</ThemedText>

      <ScrollView
        testID="grille-sieges"
        horizontal
        showsHorizontalScrollIndicator
        style={styles.grilleDefilement}
        contentContainerStyle={styles.grille}
      >
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
                disabled={!reservationOuverte || s.etat !== 'libre' || enConfirmation}
                accessibilityLabel={siegesPerdus.has(s.id) ? `${nomSiege(s)}, pris par quelqu'un d'autre` : undefined}
                style={[
                  styles.siege,
                  styleSiege(s),
                  styleSection(s, plan.sections),
                  siegesPerdus.has(s.id) && [styles.perdu, { borderColor: theme.text }],
                ]}
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
      </ScrollView>

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
      <LegendeSections sections={plan.sections} />

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

      {nomsPerdus.length > 0 && (
        <View testID="sieges-perdus" style={styles.perdus}>
          <ThemedText type="small" style={styles.erreurTexte}>
            {nomsPerdus.length === 1 ? 'Ce siège a été pris' : 'Ces sièges ont été pris'} par quelqu'un d'autre
            pendant votre confirmation : {nomsPerdus.join(' ; ')}. {nomsPerdus.length === 1 ? 'Il est encadré' : 'Ils sont encadrés'} sur le plan.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selection.size === 0
              ? 'Choisissez d’autres sièges libres.'
              : selection.size === 1
                ? 'Votre autre siège reste sélectionné : vous pouvez confirmer à nouveau.'
                : `Vos ${selection.size} autres sièges restent sélectionnés : vous pouvez confirmer à nouveau.`}
          </ThemedText>
        </View>
      )}

      {succes && selection.size === 0 && !erreurReservation && (
        <ThemedText type="small" style={styles.succesTexte}>
          Réservation confirmée !
        </ThemedText>
      )}

      {reservationOuverte && secondesRestantes !== null && (
        <ThemedText type="small" themeColor="textSecondary">
          Temps restant pour confirmer : {secondesRestantes}s
        </ThemedText>
      )}

      {reservationOuverte && enConfirmation && (
        <View
          style={[styles.recapitulatif, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          <ThemedText type="smallBold">Confirmer votre réservation</ThemedText>
          {siegesChoisis.map((s) => (
            <View key={s.id} style={styles.ligneRecap}>
              <ThemedText type="small" themeColor="textSecondary">
                Rangée {lettreRangee(s.rangee)}, siège {s.colonne}
              </ThemedText>
              {s.prix !== null && s.prix !== undefined && (
                <ThemedText type="small" themeColor="textSecondary">
                  {formatMontant(s.prix)}
                </ThemedText>
              )}
            </View>
          ))}
          {prixConnus && siegesChoisis.length > 0 && (
            <View style={styles.ligneRecap}>
              <ThemedText type="smallBold">Total</ThemedText>
              <ThemedText type="smallBold">{formatMontant(total)}</ThemedText>
            </View>
          )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ligneRecap: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  container: { flexGrow: 1, padding: Spacing.four, gap: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Sans flexGrow: 0, le ScrollView horizontal s'étire en hauteur et laisse un grand vide sous une
  // petite salle, avant la légende.
  grilleDefilement: { flexGrow: 0 },
  grille: { flexDirection: 'column', gap: Spacing.two },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  lettreRangee: { width: 16, textAlign: 'center' },
  siege: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  siegeTexte: { color: '#ffffff' },
  dispo: { backgroundColor: '#22c55e' },
  occupe: { backgroundColor: '#ef4444' },
  selectionne: { backgroundColor: '#2563eb' },
  enSelection: { backgroundColor: '#eab308' },
  perdu: { borderWidth: 3 },
  perdus: { gap: Spacing.one },
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
