import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';
import { groupSiegesParRangee, lettreRangee } from '@/utils/salle';

// Les chiffres sont rechargés à intervalle régulier pour suivre les ventes « en direct » (#13).
// ponytail: sondage simple en attendant le WebSocket (#8) ; #35 pourra le remplacer par des messages poussés.
export const INTERVALLE_RAFRAICHISSEMENT_MS = 5000;

const COULEURS = { vendu: '#ef4444', en_selection: '#f59e0b', libre: '#22c55e' };

function formatMontant(montant) {
  return Number(montant).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

function formatHeure(date) {
  return date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

export default function VentesEvenementScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const theme = useTheme();
  const [ventes, setVentes] = useState(null);
  const [erreur, setErreur] = useState('');
  const [miseAJour, setMiseAJour] = useState(null);

  useEffect(() => {
    // AuthProvider relit le jeton depuis le stockage au démarrage : sans lui, l'API répondrait 401.
    if (!token) return undefined;

    let annule = false;
    async function charger() {
      try {
        const res = await fetch(`${API_URL}/evenements/${id}/ventes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des ventes.');
        if (annule) return;
        setVentes(json.data);
        setErreur('');
        setMiseAJour(new Date());
      } catch (err) {
        // On garde les derniers chiffres affichés : le prochain rafraîchissement retentera.
        if (!annule) setErreur(err.message || 'Échec du chargement des ventes.');
      }
    }

    charger();
    const minuterie = setInterval(charger, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      clearInterval(minuterie);
    };
  }, [id, token]);

  if (!ventes) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Ventes' }} />
        {erreur ? (
          <ThemedText style={styles.erreur}>{erreur}</ThemedText>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
      </ThemedView>
    );
  }

  const { evenement, salle, totaux, recette, sieges } = ventes;
  const tauxRemplissage = totaux.total > 0 ? Math.round((totaux.vendus / totaux.total) * 100) : 0;
  const { rangees, numerosRangees } = groupSiegesParRangee(sieges);

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Ventes' }} />
      <View style={[styles.page, { maxWidth: MaxContentWidth }]}>
        <View style={styles.entete}>
          <ThemedText style={styles.titre}>{evenement.titre}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {formatDateHeure(evenement.dateHeure)} · {salle.nom}
          </ThemedText>
          <View style={styles.direct}>
            <View style={[styles.pointDirect, { backgroundColor: erreur ? '#DC2626' : COULEURS.libre }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {erreur
                ? `Connexion perdue, nouvel essai dans quelques secondes (${erreur})`
                : `En direct · mis à jour à ${formatHeure(miseAJour)}`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.chiffres}>
          <Chiffre label="Vendus" valeur={totaux.vendus} couleur={COULEURS.vendu} theme={theme} />
          <Chiffre label="En sélection" valeur={totaux.enSelection} couleur={COULEURS.en_selection} theme={theme} />
          <Chiffre label="Libres" valeur={totaux.libres} couleur={COULEURS.libre} theme={theme} />
          <Chiffre label="Recette" valeur={recette === null ? '—' : formatMontant(recette)} theme={theme} />
        </View>

        <View style={styles.remplissage}>
          <View style={styles.remplissageTitre}>
            <ThemedText type="smallBold">Remplissage</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {totaux.vendus} / {totaux.total} sièges vendus ({tauxRemplissage} %)
            </ThemedText>
          </View>
          <View style={[styles.barre, { backgroundColor: theme.backgroundElement }]}>
            <View
              testID="barre-vendus"
              style={[styles.barreSegment, { flex: totaux.vendus, backgroundColor: COULEURS.vendu }]}
            />
            <View style={[styles.barreSegment, { flex: totaux.enSelection, backgroundColor: COULEURS.en_selection }]} />
            <View style={[styles.barreSegment, { flex: totaux.libres }]} />
          </View>
        </View>

        <View style={styles.plan}>
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
                  <ThemedText type="small" themeColor="textSecondary" style={styles.lettreRangee}>
                    {lettreRangee(rangee)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.legende}>
            {[
              ['vendu', 'Vendu'],
              ['en_selection', 'En sélection'],
              ['libre', 'Libre'],
            ].map(([etat, label]) => (
              <View key={etat} style={styles.legendeItem}>
                <View style={[styles.pastille, { backgroundColor: COULEURS[etat] }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', padding: 24, gap: 24 },
  entete: { gap: 4 },
  titre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  direct: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pointDirect: { width: 8, height: 8, borderRadius: 4 },
  chiffres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chiffre: { flexGrow: 1, flexBasis: 140, borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
  chiffreTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chiffreValeur: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  remplissage: { gap: 8 },
  remplissageTitre: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  barre: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  barreSegment: { height: '100%' },
  plan: { gap: 12 },
  grille: { gap: 8 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lettreRangee: { width: 16, textAlign: 'center' },
  siege: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  siegeTexte: { color: '#ffffff' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pastille: { width: 12, height: 12, borderRadius: 3 },
  erreur: { color: '#DC2626', textAlign: 'center' },
});
