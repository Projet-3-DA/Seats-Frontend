import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';
import { groupSiegesParRangee, lettreRangee } from '@/utils/salle';
import { formatTarif } from '@/utils/tarif';

// Mêmes couleurs que le tableau de bord des ventes de l'organisateur (#13).
const COULEURS = { vendu: '#ef4444', en_selection: '#f59e0b', libre: '#22c55e' };
const LIBELLES = { vendu: 'Vendu', en_selection: 'En sélection', libre: 'Libre' };

function formatMontant(montant) {
  return Number(montant).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

function Info({ icone, children, theme }) {
  return (
    <View style={styles.info}>
      <Feather name={icone} size={16} color={theme.textSecondary} />
      <ThemedText style={styles.infoTexte}>{children}</ThemedText>
    </View>
  );
}

function Chiffre({ label, valeur, couleur, theme }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${valeur}`}
      style={[styles.chiffre, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <View style={styles.chiffreTitre}>
        {couleur && <View style={[styles.pastille, { backgroundColor: couleur }]} />}
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <ThemedText style={styles.chiffreValeur}>{valeur}</ThemedText>
    </View>
  );
}

// Détail d'un événement pour l'administrateur (#36) : lecture seule, quel que soit l'organisateur.
export default function DetailEvenementAdminScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const theme = useTheme();
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    let annule = false;
    async function charger() {
      try {
        const res = await fetch(`${API_URL}/admin/evenements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Échec du chargement de l'événement.");
        if (!annule) setDetail(json.data);
      } catch (err) {
        if (!annule) setErreur(err.message || "Échec du chargement de l'événement.");
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [id, token]);

  if (!detail) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Événement' }} />
        {erreur ? (
          <ThemedText style={styles.erreur}>{erreur}</ThemedText>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
      </ThemedView>
    );
  }

  const { evenement, salle, organisateur, totaux, recette, sieges } = detail;
  const reservations = sieges.filter((s) => s.reservation);
  const { rangees, numerosRangees } = groupSiegesParRangee(sieges);

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Événement' }} />
      <View style={[styles.page, { maxWidth: MaxContentWidth }]}>
        <View style={styles.entete}>
          <Affiche uri={evenement.afficheUrl} style={styles.affiche} />
          <View style={styles.enteteTexte}>
            <ThemedText style={styles.titre}>{evenement.titre}</ThemedText>
            <View style={[styles.badge, { borderColor: evenement.terminee ? theme.border : COULEURS.libre }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {evenement.terminee ? 'Terminé' : 'À venir'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.infos}>
          <Info icone="calendar" theme={theme}>
            {formatDateHeure(evenement.dateHeure)}
          </Info>
          <Info icone="map-pin" theme={theme}>
            {salle.nom}
          </Info>
          <Info icone="user" theme={theme}>
            {`Organisé par ${organisateur.prenom} ${organisateur.nom} (${organisateur.email})`}
          </Info>
          <Info icone="tag" theme={theme}>
            {formatTarif(evenement.tarif)}
          </Info>
          {evenement.createdAt && (
            <Info icone="clock" theme={theme}>
              {`Créé le ${formatDateHeure(evenement.createdAt)}`}
            </Info>
          )}
        </View>

        {evenement.description ? <ThemedText>{evenement.description}</ThemedText> : null}

        <View style={styles.chiffres}>
          <Chiffre label="Vendus" valeur={totaux.vendus} couleur={COULEURS.vendu} theme={theme} />
          <Chiffre label="En sélection" valeur={totaux.enSelection} couleur={COULEURS.en_selection} theme={theme} />
          <Chiffre label="Libres" valeur={totaux.libres} couleur={COULEURS.libre} theme={theme} />
          <Chiffre label="Recette" valeur={recette === null ? '—' : formatMontant(recette)} theme={theme} />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Plan de salle</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.grille}>
              {numerosRangees.map((rangee) => (
                <View key={rangee} style={styles.rangee}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.lettreRangee}>
                    {lettreRangee(rangee)}
                  </ThemedText>
                  {rangees[rangee].map((s) => (
                    <View
                      key={s.id}
                      testID={`siege-${s.id}`}
                      accessibilityLabel={`Rangée ${lettreRangee(s.rangee)}, siège ${s.colonne} : ${s.etat}`}
                      style={[styles.siege, { backgroundColor: COULEURS[s.etat] }]}
                    >
                      <ThemedText type="small" style={styles.siegeTexte}>
                        {s.colonne}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.legende}>
            {Object.entries(LIBELLES).map(([etat, label]) => (
              <View key={etat} style={styles.legendeItem}>
                <View style={[styles.pastille, { backgroundColor: COULEURS[etat] }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">{`Réservations (${reservations.length})`}</ThemedText>
          {reservations.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aucune réservation pour cet événement.
            </ThemedText>
          ) : (
            reservations.map((s) => (
              <View key={s.id} style={[styles.reservation, { borderColor: theme.border }]}>
                <View style={[styles.pastille, { backgroundColor: COULEURS[s.etat] }]} />
                <View style={styles.reservationTexte}>
                  <ThemedText type="small">
                    {`Rangée ${lettreRangee(s.rangee)}, siège ${s.colonne} · ${LIBELLES[s.etat]}`}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {`${s.reservation.spectateur.prenom} ${s.reservation.spectateur.nom} (${s.reservation.spectateur.email})`}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', padding: 24, gap: 24 },
  entete: { flexDirection: 'row', gap: 16 },
  affiche: { width: 96, height: 144 },
  enteteTexte: { flex: 1, gap: 8, alignItems: 'flex-start' },
  titre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 },
  infos: { gap: 8 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTexte: { flex: 1 },
  chiffres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chiffre: { flexGrow: 1, flexBasis: 140, borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
  chiffreTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chiffreValeur: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  section: { gap: 12 },
  grille: { gap: 8 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lettreRangee: { width: 16, textAlign: 'center' },
  siege: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  siegeTexte: { color: '#ffffff' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pastille: { width: 12, height: 12, borderRadius: 3 },
  reservation: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 8 },
  reservationTexte: { flex: 1, gap: 2 },
  erreur: { color: '#DC2626', textAlign: 'center' },
});
