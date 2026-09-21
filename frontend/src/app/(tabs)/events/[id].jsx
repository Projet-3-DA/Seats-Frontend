import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function EventSeatMapScreen() {
  const { id } = useLocalSearchParams();
  const [plan, setPlan] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setChargement(true);
    fetch(`${API_URL}/evenements/${id}/plan`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then((json) => setPlan(json.data))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [id]);

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

  const rangees = {};
  plan.sieges.forEach((s) => {
    (rangees[s.rangee] ??= []).push(s);
  });
  const numerosRangees = Object.keys(rangees).sort((a, b) => a - b);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{plan.salle.nom}</ThemedText>

      <View style={styles.grille}>
        {numerosRangees.map((rangee) => (
          <View key={rangee} style={styles.rangee}>
            {rangees[rangee]
              .sort((a, b) => a.colonne - b.colonne)
              .map((s) => (
                <View
                  key={s.id}
                  style={[styles.siege, s.etat === 'reserve' ? styles.occupe : styles.dispo]}
                >
                  <ThemedText type="small" style={styles.siegeTexte}>
                    {s.colonne}
                  </ThemedText>
                </View>
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
  legende: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pastille: { width: 12, height: 12, borderRadius: 3 },
});